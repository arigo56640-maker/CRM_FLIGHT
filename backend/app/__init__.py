import os
from flask import Flask, send_from_directory
from dotenv import load_dotenv

load_dotenv()


def create_app():
    app = Flask(
        __name__,
        static_folder=os.path.join(os.path.dirname(__file__), "..", "..", "frontend"),
        static_url_path="",
    )

    env = os.environ.get("FLASK_ENV", "production")
    from app.config import config_map
    app.config.from_object(config_map.get(env, config_map["production"]))

    from app.routes import register_blueprints
    register_blueprints(app)

    from app.scheduler import start_scheduler
    start_scheduler(app)

    return app
