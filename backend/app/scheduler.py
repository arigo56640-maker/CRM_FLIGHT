from apscheduler.schedulers.background import BackgroundScheduler

_scheduler = BackgroundScheduler(daemon=True)


def start_scheduler(app):
    def job():
        with app.app_context():
            from app.services.sla_service import check_sla
            check_sla()

    _scheduler.add_job(
        func=job,
        trigger="interval",
        minutes=1,
        id="sla_checker",
        replace_existing=True,
    )

    if not _scheduler.running:
        _scheduler.start()
