from app.extensions import get_supabase


def add_event(lead_id: str, event_type: str, content: str) -> dict:
    """Insert a timeline event and return the created row."""
    sb = get_supabase()
    result = (
        sb.table("timeline_events")
        .insert({"lead_id": lead_id, "type": event_type, "content": content})
        .execute()
    )
    return result.data[0] if result.data else {}


def get_timeline(lead_id: str) -> list:
    """Return all timeline events for a lead, oldest first."""
    sb = get_supabase()
    result = (
        sb.table("timeline_events")
        .select("*")
        .eq("lead_id", lead_id)
        .order("created_at", desc=False)
        .execute()
    )
    return result.data or []
