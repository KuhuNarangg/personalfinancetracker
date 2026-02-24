import os, django, json
from datetime import datetime
from django.utils import timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from finance.jobs import send_subscription_reminders

print("Running send_subscription_reminders...")
send_subscription_reminders()
print("Done.")
