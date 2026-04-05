from flask import Blueprint, request, jsonify
from app.services import lead_service

leads_bp = Blueprint("leads", __name__)


@leads_bp.post("/leads")
def create_lead():
    data = request.get_json(silent=True) or {}
    if not data.get("name"):
        return jsonify({"error": "name is required"}), 400
    lead = lead_service.create_lead(data)
    return jsonify(lead), 201


@leads_bp.get("/leads")
def list_leads():
    leads = lead_service.get_leads()
    return jsonify(leads)


@leads_bp.patch("/leads/<lead_id>")
def update_lead(lead_id):
    data = request.get_json(silent=True) or {}
    lead = lead_service.update_lead(lead_id, data)
    if lead is None:
        return jsonify({"error": "Lead not found"}), 404
    return jsonify(lead)
