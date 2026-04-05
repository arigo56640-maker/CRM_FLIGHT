import os
from flask import send_from_directory


def register_blueprints(app):
    from app.routes.leads import leads_bp
    from app.routes.timeline import timeline_bp

    app.register_blueprint(leads_bp)
    app.register_blueprint(timeline_bp)

    @app.route("/")
    def index():
        return send_from_directory(app.static_folder, "index.html")
