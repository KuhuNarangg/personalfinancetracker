from django.apps import AppConfig


class FinanceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'finance'

    def ready(self):
        # Set search path on every connection
        from django.db.backends.signals import connection_created
        from django.dispatch import receiver

        @receiver(connection_created)
        def set_search_path(sender, connection, **kwargs):
            if connection.vendor == 'postgresql':
                with connection.cursor() as cursor:
                    cursor.execute('SET search_path TO financetracker, public')

        import os
        if os.environ.get('RUN_MAIN') == 'true':
            from finance import updater
            updater.start()
