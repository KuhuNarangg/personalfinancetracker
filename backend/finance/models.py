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
    is_active = models.BooleanField(default=True)
    next_due_date = models.DateField(null=True, blank=True)
    subscription_months = models.IntegerField(null=True, blank=True, help_text="Total months to run the subscription")
    months_paid = models.IntegerField(default=0, help_text="Number of months already billed/reminded")

    def __str__(self):
        return self.title


class Goal(models.Model):
    """
    A saving goal (e.g. 'Buy a Car').
    monthly_data is a list of dicts:
      [{month: 1, status: 'pending'|'paid'|'missed', planned: float, actual: float|null}, ...]
    """
    user           = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    title          = models.CharField(max_length=255)
    target_amount  = models.FloatField(help_text="Total amount to save")
    monthly_salary = models.FloatField(help_text="User in-hand monthly salary")
    months_target  = models.IntegerField(help_text="Total months planned")
    monthly_saving = models.FloatField(help_text="Planned saving per month (target / months)")
    months_done    = models.IntegerField(default=0)
    amount_saved   = models.FloatField(default=0.0)
    is_active      = models.BooleanField(default=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    monthly_data   = models.JSONField(default=list)

    def __str__(self):
        return f"{self.user.username} - {self.title}"