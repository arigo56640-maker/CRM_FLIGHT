from flask import Blueprint, request, jsonify
from app.services import timeline_service, lead_service

timeline_bp = Blueprint("timeline", __name__)


@timeline_bp.get("/leads/<lead_id>/timeline")
def get_timeline(lead_id):
    if lead_service.get_lead(lead_id) is None:
        return jsonify({"error": "Lead not found"}), 404
    events = timeline_service.get_timeline(lead_id)
    return jsonify(events)


@timeline_bp.post("/leads/<lead_id>/timeline")
def add_event(lead_id):
    if lead_service.get_lead(lead_id) is None:
        return jsonify({"error": "Lead not found"}), 404
    data = request.get_json(silent=True) or {}
    content = data.get("content", "").strip()
    event_type = data.get("type", "note")
    if not content:
        return jsonify({"error": "content is required"}), 400
    if event_type not in ("note", "status_change", "bot"):
        return jsonify({"error": "invalid type"}), 400
    event = timeline_service.add_event(lead_id, event_type, content)
    return jsonify(event), 201
