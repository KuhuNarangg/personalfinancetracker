import os
import django
from django.utils import timezone
from django.contrib.auth.models import User
from finance.models import Expense
from finance.jobs import send_subscription_reminders

# Create or get a user with the provided email
user, _ = User.objects.get_or_create(username='testuser', defaults={'email': 'kuhunarang@gmail.com'})

# Ensure the email is set if the user already existed
user.email = 'kuhunarang@gmail.com'
user.save()

# Create a sample subscription expense due today
current_day = timezone.localdate().day
expense = Expense.objects.create(
    user=user,
    title='Test Subscription Reminder',
    amount=99.99,
    category='Software',
    is_subscription=True,
    expense_type='subscription',
    billing_day=current_day,
    subscription_months=12,
    months_paid=0
)

print(f"Created expense ID {expense.id} for user {user.username} with billing_day {current_day}")

# Run the job manually
send_subscription_reminders()

print("Ran subscription reminder job.")
