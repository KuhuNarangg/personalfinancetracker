from django.apps import AppConfig


class FinanceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'finance'

    def ready(self):
        import os
        if os.environ.get('RUN_MAIN'):
            from finance import updater
            updater.start()
