from datetime import datetime, timezone, timedelta
from app.extensions import get_supabase

CLOSED_STATUSES = ["Closed-Won", "Closed-Lost"]
STALE_HOURS = 24


def check_sla():
    """
    Runs every minute via APScheduler.
    Marks leads as stale when no activity for 24h and not closed.
    """
    sb = get_supabase()
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=STALE_HOURS)).isoformat()

    # Fetch open leads not yet marked stale
    result = (
        sb.table("leads")
        .select("id, last_contacted_at, created_at")
        .not_.in_("status", CLOSED_STATUSES)
        .eq("is_stale", False)
        .execute()
    )
    leads = result.data or []

    stale_ids = []
    for lead in leads:
        last_activity = lead.get("last_contacted_at") or lead.get("created_at")
        if last_activity and last_activity < cutoff:
            stale_ids.append(lead["id"])

    if stale_ids:
        sb.table("leads").update({"is_stale": True}).in_("id", stale_ids).execute()
