import os, django, json
from datetime import datetime
from django.utils import timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.test import RequestFactory
from finance.views import add_expense
from finance.models import Expense
from finance.jobs import send_subscription_reminders

today = timezone.localdate()
day_str = str(today.day)

factory = RequestFactory()
request = factory.post(
    '/api/add-expense/',
    data=json.dumps({
        'username': 'newuser1',
        'title': 'Test SIP',
        'amount': 1000,
        'category': 'Mutual Fund',
        'expense_type': 'sip',
        'billing_day': day_str,
        'billing_period': 'monthly'
    }),
    content_type='application/json'
)

# 1. Test immediate "Added" email
response = add_expense(request)
print("--- ADD SIP RESPONSE ---")
print(response.status_code, response.content)

exp = Expense.objects.last()
print("\n--- CREATED SIP DATA ---")
print("Title:", exp.title)
print("Type:", exp.expense_type)
print("Billing Day:", exp.billing_day, type(exp.billing_day))
print("Months Paid (after instant email):", exp.months_paid)
print("Is Active:", exp.is_active)

# 2. Test Cron Job (simulating next month)
print("\n--- CHRON JOB TEST ---")
exp.date = exp.date - timezone.timedelta(days=30)
exp.save()
send_subscription_reminders()

exp.refresh_from_db()
print("Months Paid (after cron):", exp.months_paid)

