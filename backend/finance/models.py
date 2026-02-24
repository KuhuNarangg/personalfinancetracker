from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Expense(models.Model):
    EXPENSE_TYPES = [
        ('expense', 'One-time Expense'),
        ('subscription', 'Subscription'),
        ('sip', 'SIP Investment'),
        ('emi', 'EMI / Loan'),
        ('insurance', 'Insurance'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    amount = models.FloatField()
    category = models.CharField(max_length=100, blank=True)
    date = models.DateTimeField(default=timezone.now)
    is_subscription = models.BooleanField(default=False)
    billing_date = models.DateField(null=True, blank=True)
    billing_day = models.IntegerField(null=True, blank=True)
    billing_period = models.CharField(max_length=20, blank=True, default='')
    expense_type = models.CharField(max_length=20, choices=EXPENSE_TYPES, default='expense')
    is_active = models.BooleanField(default=True)  # False = subscription stopped
    next_due_date = models.DateField(null=True, blank=True)
    subscription_months = models.IntegerField(null=True, blank=True, help_text="Total months to run the subscription")
    months_paid = models.IntegerField(default=0, help_text="Number of months already billed/reminded")


    def __str__(self):
        return self.title