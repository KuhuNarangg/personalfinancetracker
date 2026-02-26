import logging
from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import DjangoJobStore
from .jobs import send_subscription_reminders

logger = logging.getLogger(__name__)

def start():
    scheduler = BackgroundScheduler(timezone="Asia/Kolkata")
    scheduler.add_jobstore(DjangoJobStore(), "default")

    # Register job — replace_existing=True prevents duplicate jobs on server restart
    scheduler.add_job(
        send_subscription_reminders,
        trigger="cron",
        hour=10,
        minute=0,
        id="send_subscription_reminders",
        max_instances=1,
        replace_existing=True,
    )

    scheduler.start()
    logger.info("APScheduler started — subscription reminders at 10:00 AM daily (Asia/Kolkata).")
