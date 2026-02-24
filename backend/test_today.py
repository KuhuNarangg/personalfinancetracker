import os, django, json
from datetime import datetime
from django.utils import timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.test import RequestFactory
from finance.views import add_expense
from finance.models import Expense

today_str = timezone.localdate().strftime("%Y-%m-%d")

factory = RequestFactory()
request = factory.post(
    '/api/add-expense/',
    data=json.dumps({
        'username': 'newuser1',
        'title': 'Test Sub Start Today',
        'amount': 500,
        'category': 'Entertainment',
        'expense_type': 'subscription',
        'billing_date': today_str
    }),
    content_type='application/json'
)

response = add_expense(request)
print("Add Expense Response:", response.status_code, response.content)

exp = Expense.objects.last()
print("Expense created:")
print("- title:", exp.title)
print("- is_subscription:", exp.is_subscription)
print("- billing_date:", exp.billing_date)
print("- billing_day:", exp.billing_day)
print("- months_paid:", exp.months_paid)
