"""Ручное управление демо-ботом записи клиентов (main/bot.py).

Обычно эти команды не нужны: бот запускается вместе с сайтом - на сервере через
вебхук, локально вместе с `manage.py runserver`.

    manage.py demo_bot info      - имя бота и к чему он подключён
    manage.py demo_bot webhook   - заново подключить бота к сайту и сбросить накопившиеся сообщения
    manage.py demo_bot unhook    - отключить бота от сервера, чтобы попробовать его локально
    manage.py demo_bot poll      - запустить бота без сайта
"""
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from main import bot


class Command(BaseCommand):
    help = 'Демо-бот записи клиентов: info | webhook | unhook | poll'

    def add_arguments(self, parser):
        parser.add_argument('action', choices=['info', 'webhook', 'unhook', 'poll'])

    def handle(self, action, **options):
        if not settings.DEMO_BOT_TOKEN:
            raise CommandError('В .env не задан DEMO_BOT_TOKEN')
        getattr(self, action)()

    def info(self):
        me = bot.call('getMe') or {}
        hook = bot.call('getWebhookInfo') or {}
        self.stdout.write(f"Бот: @{me.get('username', '?')}")
        self.stdout.write(f"Вебхук: {hook.get('url') or 'не подключён'}")
        if hook.get('last_error_message'):
            self.stdout.write(f"Последняя ошибка вебхука: {hook['last_error_message']}")

    def webhook(self):
        if not bot.connect_webhook(drop_pending=True):
            raise CommandError('Telegram не принял вебхук, подробности в сообщении выше')
        self.stdout.write(self.style.SUCCESS(f'Вебхук подключён: {bot.webhook_url()}'))

    def unhook(self):
        bot.call('deleteWebhook')
        self.stdout.write('Вебхук отключён')

    def poll(self):
        self.stdout.write('Остановить: Ctrl+C')
        bot.poll(announce=self.stdout.write)
