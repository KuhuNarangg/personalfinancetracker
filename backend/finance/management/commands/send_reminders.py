from django.core.management.base import BaseCommand
from finance.jobs import send_subscription_reminders

class Command(BaseCommand):
    help = 'Sends subscription reminders for active expenses on their billing day'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("Starting send_subscription_reminders job..."))
        try:
            send_subscription_reminders()
            self.stdout.write(self.style.SUCCESS('Successfully completed send_subscription_reminders job.'))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error executing send_subscription_reminders: {str(e)}"))
