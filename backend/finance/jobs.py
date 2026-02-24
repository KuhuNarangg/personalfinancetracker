import datetime
import logging
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import Expense
from django.db.models import F, Q

logger = logging.getLogger(__name__)

def send_subscription_reminders():
    """
    Job to send subscription reminders.
    Finds all active subscriptions mapped to today's day of the month.
    """
    today = timezone.localdate()
    current_day = today.day

    # Find subscriptions that are active, are of type subscription, sip, emi, insurance or is_subscription=True
    # and whose billing_day is today.
    # Exclude those where subscription_months is not null and months_paid >= subscription_months
    subscriptions = Expense.objects.filter(
        (Q(is_subscription=True) | Q(expense_type__in=['subscription', 'sip', 'emi', 'insurance'])),
        is_active=True,
        billing_day=current_day
    ).exclude(
        subscription_months__isnull=False,
        months_paid__gte=F('subscription_months')
    ).exclude(
        date__date=today,
        months_paid__gte=1
    ).select_related('user')

    emails_to_send = []
    
    # We can group by user or just send individually. Let's send individually for simplicity.
    for sub in subscriptions:
        user = sub.user
        if not user.email:
            continue

        etype = sub.expense_type.capitalize() if sub.expense_type else "Subscription"
        subject = f"{etype} Reminder: {sub.title}"
        message = (
            f"Hi {user.username},\n\n"
            f"This is a reminder that your {sub.expense_type or 'subscription'} for {sub.title} revolves today.\n"
            f"Amount: {sub.amount}\n"
        )
        
        if sub.subscription_months:
            remaining = sub.subscription_months - (sub.months_paid + 1)
            message += f"Months remaining after this: {remaining}\n"

        message += "\nThank you!"

        try:
            send_mail(
                subject,
                message,
                settings.EMAIL_HOST_USER,
                [user.email],
                fail_silently=False,
            )
            # Increment months_paid after successful email
            sub.months_paid += 1
            if sub.subscription_months and sub.months_paid >= sub.subscription_months:
                sub.is_active = False # Deactivate if completed
            sub.save()
            logger.info(f"Successfully sent reminder for {sub.title} to {user.email}")
        except Exception as e:
            logger.error(f"Failed to send email for {sub.title} to {user.email}: {e}")

