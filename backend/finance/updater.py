from apscheduler.schedulers.background import BackgroundScheduler
from .jobs import send_subscription_reminders

def start():
    scheduler = BackgroundScheduler()
    # Runs everyday at a specific time. For testing, we can run it every 1 minute if needed,
    # but for production we run it once a day. Let's schedule it to run every day at 10 AM.
    # To prevent it from sending multiple times a day if the server restarts, we should rely on months_paid
    # but currently it checks `billing_day`.
    scheduler.add_job(send_subscription_reminders, 'cron', hour=10, minute=0)
    
    # Optional: For testing purposes during development, you can uncomment the next line to run every minute
    # scheduler.add_job(send_subscription_reminders, 'interval', minutes=1)
    
    scheduler.start()
