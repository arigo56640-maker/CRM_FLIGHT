from datetime import datetime, timezone
from app.extensions import get_supabase
from app.services import timeline_service

CLOSED_STATUSES = {"Closed-Won", "Closed-Lost"}


def _urgency_rank(lead: dict) -> int:
    """0=overdue, 1=new, 2=stale, 3=other (lower = more urgent)."""
    if lead.get("is_overdue"):
        return 0
    if lead.get("status") == "New":
        return 1
    if lead.get("is_stale"):
        return 2
    return 3


def _compute_overdue(lead: dict) -> bool:
    """A lead is overdue if it's New, never contacted, and older than 10 minutes."""
    if lead.get("status") != "New":
        return False
    if lead.get("last_contacted_at") is not None:
        return False
    created_at = lead.get("created_at")
    if not created_at:
        return False
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    age_minutes = (now - created_at).total_seconds() / 60
    return age_minutes > 10


def get_leads() -> list:
    """Fetch all leads, annotate with is_overdue and urgency_rank, sort by urgency."""
    sb = get_supabase()
    result = sb.table("leads").select("*").execute()
    leads = result.data or []

    for lead in leads:
        lead["is_overdue"] = _compute_overdue(lead)

    leads.sort(key=lambda l: (_urgency_rank(l), l.get("created_at", "")))
    return leads


def get_lead(lead_id: str) -> dict | None:
    sb = get_supabase()
    result = sb.table("leads").select("*").eq("id", lead_id).execute()
    if not result.data:
        return None
    lead = result.data[0]
    lead["is_overdue"] = _compute_overdue(lead)
    return lead


def create_lead(data: dict) -> dict:
    """Insert a new lead and auto-add the bot welcome event."""
    sb = get_supabase()
    allowed = {
        "name", "phone", "email", "destination", "departure_date",
        "baggage_required", "baggage_details",
        "date_change_requested", "date_change_details",
    }
    payload = {k: v for k, v in data.items() if k in allowed}
    result = sb.table("leads").insert(payload).execute()
    lead = result.data[0]

    timeline_service.add_event(lead["id"], "bot", "Auto-response sent")

    lead["is_overdue"] = _compute_overdue(lead)
    return lead


def update_lead(lead_id: str, data: dict) -> dict | None:
    """PATCH a lead. Logs status changes and updates last_contacted_at."""
    existing = get_lead(lead_id)
    if existing is None:
        return None

    allowed = {
        "name", "phone", "email", "destination", "departure_date",
        "status", "baggage_required", "baggage_details",
        "date_change_requested", "date_change_details",
    }
    payload = {k: v for k, v in data.items() if k in allowed}

    status_changed = "status" in payload and payload["status"] != existing.get("status")
    if status_changed:
        payload["last_contacted_at"] = datetime.now(timezone.utc).isoformat()

    sb = get_supabase()
    result = sb.table("leads").update(payload).eq("id", lead_id).execute()
    updated = result.data[0]

    if status_changed:
        timeline_service.add_event(
            lead_id,
            "status_change",
            f"Status changed to {payload['status']}",
        )

    updated["is_overdue"] = _compute_overdue(updated)
    return updated
