from django.apps import AppConfig


class MainConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'main'

    def ready(self):
        # демо-бот записи клиентов стартует вместе с сайтом
        from . import bot
        bot.autostart()
