"""Демо-бот записи клиентов в Telegram.

Запись «понарошку», как формы в остальных демо: бот ничего не сохраняет. Всё, что
клиент выбрал (услуга, мастер, день, время), передаётся в данных кнопок, поэтому
боту не нужны ни база, ни отдельный процесс.

Бот запускается вместе с сайтом (autostart, вызывается из apps.py):
- на сервере (gunicorn) сайт сам подключает вебхук: Telegram присылает сообщения
  на адрес сайта, их принимает views.telegram_demo_bot;
- локально (manage.py runserver) до компьютера Telegram не достучится, поэтому бот
  сам опрашивает Telegram в фоновом потоке.
У одного бота работает что-то одно. Если вебхук уже подключён, то есть бот работает
на сервере, локальный запуск его не трогает.
"""
import hashlib
import json
import logging
import os
import ssl
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

from django.conf import settings

log = logging.getLogger(__name__)

WEBHOOK_PATH = '/api/telegram/demo-bot/'
TZ = timezone(timedelta(hours=5))  # время Казахстана
DAYS_AHEAD = 6  # на сколько дней вперёд можно записаться
WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

# код в данных кнопки -> (название, цена в тенге, длительность)
SERVICES = {
    'cut': ('Стрижка', 5000, '45 мин'),
    'beard': ('Стрижка и борода', 7500, '1 ч 15 мин'),
    'color': ('Окрашивание', 15000, '2 ч'),
    'nails': ('Маникюр', 8000, '1 ч 30 мин'),
}
MASTERS = {'a': 'Айдана', 't': 'Тимур', 'any': 'Любой свободный мастер'}
SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']

DEMO_NOTE = '<i>Это демо: запись никуда не сохраняется.</i>'
MANAGER_CHAT = 'https://t.me/devixco'


# ---------- Telegram Bot API ----------

def webhook_secret():
    """Секрет вебхука: Telegram присылает его в заголовке, по нему отсекаются чужие запросы."""
    return hashlib.sha256(settings.DEMO_BOT_TOKEN.encode()).hexdigest()[:32]


SYSTEM_CERTS = '/etc/ssl/cert.pem'
_ssl_context = None


def ssl_context():
    """Проверка сертификата Telegram.

    Python с python.org на macOS ставится без корневых сертификатов, и соединение
    не проходит проверку. В этом случае берём системный набор сертификатов.
    """
    global _ssl_context
    if _ssl_context is None:
        context = ssl.create_default_context()
        if not context.cert_store_stats()['x509_ca'] and os.path.exists(SYSTEM_CERTS):
            context.load_verify_locations(SYSTEM_CERTS)
        _ssl_context = context
    return _ssl_context


def call(method, http_timeout=10, **params):
    """Вызов метода Bot API. Возвращает результат или None, если Telegram ответил ошибкой."""
    request = urllib.request.Request(
        f'https://api.telegram.org/bot{settings.DEMO_BOT_TOKEN}/{method}',
        data=json.dumps(params).encode(),
        headers={'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(request, timeout=http_timeout, context=ssl_context()) as response:
            return json.load(response).get('result')
    except urllib.error.HTTPError as error:
        # в описании ошибки нет токена, в отличие от адреса запроса
        log.warning('Telegram %s: %s', method, error.read().decode(errors='replace')[:300])
    except (urllib.error.URLError, TimeoutError) as error:
        log.warning('Telegram %s: %s', method, getattr(error, 'reason', error))
    return None


# ---------- кнопки и подписи ----------

def button(text, data):
    return {'text': text, 'callback_data': data}


def rows(buttons, per_row):
    return [buttons[i:i + per_row] for i in range(0, len(buttons), per_row)]


def order_button():
    """Кнопка открывает чат с менеджером DevIX."""
    return {'text': '🚀 Хочу такого же бота', 'url': MANAGER_CHAT}


def money(amount):
    return f'{amount:,} ₸'.replace(',', ' ')


def today():
    return datetime.now(TZ).date()


def day_label(day):
    prefix = {0: 'Сегодня', 1: 'Завтра'}.get((day - today()).days, WEEKDAYS[day.weekday()])
    return f'{prefix}, {day.day} {MONTHS[day.month - 1]}'


def parse_day(code):
    """День из данных кнопки (ггммдд), если на него ещё можно записаться."""
    try:
        day = datetime.strptime(code, '%y%m%d').date()
    except ValueError:
        return None
    return day if 0 <= (day - today()).days <= DAYS_AHEAD else None


def free_slots(day, master):
    """Свободное время. Занятость «случайная», но постоянная для дня и мастера."""
    now = datetime.now(TZ)
    slots = []
    for slot in SLOTS:
        if day == now.date() and int(slot[:2]) <= now.hour:
            continue
        seed = hashlib.md5(f'{day}{master}{slot}'.encode()).digest()[0]
        if seed % 3:
            slots.append(slot)
    return slots


def assigned_master(master, day, slot):
    """Для «любого мастера» бот сам выбирает, к кому записать."""
    if master != 'any':
        return MASTERS[master]
    return MASTERS['a' if hashlib.md5(f'{day}{slot}'.encode()).digest()[0] % 2 else 't']


def summary(service, master, day, slot):
    name, price, duration = SERVICES[service]
    return (
        f'💈 <b>{name}</b> · {duration}\n'
        f'👤 {assigned_master(master, day, slot)}\n'
        f'🗓 {day_label(day)}, {slot}\n'
        f'💳 {money(price)}'
    )


# ---------- экраны: каждый возвращает текст и кнопки ----------

def menu_screen(greeting=True):
    text = (
        '👋 Здравствуйте! Это <b>демо-бот записи клиентов</b> от DevIX.\n\n'
        'Так может выглядеть запись в ваш салон, клинику или автосервис: клиент сам '
        'выбирает услугу, мастера и время — без звонков и ожидания.\n\n'
        'Попробуйте записаться 👇'
    ) if greeting else 'Выберите действие 👇'
    return text, [
        [button('✂️ Записаться', 's')],
        [button('💰 Услуги и цены', 'price'), button('📍 Адрес', 'addr')],
        [order_button()],
    ]


def services_screen():
    buttons = [button(f'{name} · {money(price)}', f'm:{code}') for code, (name, price, _) in SERVICES.items()]
    return '<b>Шаг 1 из 4.</b> Выберите услугу:', rows(buttons, 1) + [[button('‹ В меню', 'menu')]]


def masters_screen(service):
    buttons = [button(name, f'd:{service}:{code}') for code, name in MASTERS.items()]
    text = f'<b>Шаг 2 из 4.</b> {SERVICES[service][0]}\n\nК какому мастеру вас записать?'
    return text, rows(buttons, 1) + [[button('‹ Назад', 's')]]


def days_screen(service, master):
    days = [today() + timedelta(days=i) for i in range(DAYS_AHEAD + 1)]
    days = [day for day in days if free_slots(day, master)]
    buttons = [button(day_label(day), f't:{service}:{master}:{day:%y%m%d}') for day in days]
    who = 'любой свободный мастер' if master == 'any' else f'мастер {MASTERS[master]}'
    text = f'<b>Шаг 3 из 4.</b> {SERVICES[service][0]}, {who}\n\nВыберите день:'
    return text, rows(buttons, 2) + [[button('‹ Назад', f'm:{service}')]]


def times_screen(service, master, day):
    buttons = [
        button(slot, f'c:{service}:{master}:{day:%y%m%d}:{slot.replace(":", "")}')
        for slot in free_slots(day, master)
    ]
    text = f'<b>Шаг 4 из 4.</b> {SERVICES[service][0]}\n\nСвободное время на <b>{day_label(day).lower()}</b>:'
    return text, rows(buttons, 4) + [[button('‹ Назад', f'd:{service}:{master}')]]


def confirm_screen(service, master, day, slot):
    code = f'{service}:{master}:{day:%y%m%d}:{slot.replace(":", "")}'
    text = f'Проверьте запись:\n\n{summary(service, master, day, slot)}\n\nВсё верно?'
    return text, [
        [button('✅ Подтвердить', f'ok:{code}')],
        [button('✏️ Изменить', 's'), button('‹ Назад', f't:{service}:{master}:{day:%y%m%d}')],
    ]


def done_screen(service, master, day, slot):
    code = f'{service}:{master}:{day:%y%m%d}:{slot.replace(":", "")}'
    text = (
        f'✅ <b>Вы записаны!</b>\n\n{summary(service, master, day, slot)}\n\n'
        f'📍 Астана, пр. Примерный, 1\n🔔 За 2 часа до визита пришлю напоминание.\n\n{DEMO_NOTE}'
    )
    return text, [
        [button('🔁 Перенести', f'd:{service}:{master}'), button('❌ Отменить', f'x:{code}')],
        [button('🏠 В меню', 'menu')],
        [order_button()],
    ]


def cancelled_screen(service, master, day, slot):
    text = f'❌ <b>Запись отменена</b>\n\n<s>{SERVICES[service][0]}, {day_label(day).lower()}, {slot}</s>\n\nЕсли планы изменятся — запишитесь снова.'
    return text, [[button('✂️ Записаться снова', 's')], [button('🏠 В меню', 'menu')]]


def price_screen():
    lines = [f'• {name} — <b>{money(price)}</b>, {duration}' for name, price, duration in SERVICES.values()]
    return '💰 <b>Услуги и цены</b>\n\n' + '\n'.join(lines), [[button('✂️ Записаться', 's')], [button('‹ В меню', 'menu')]]


def address_screen():
    text = (
        '📍 <b>Адрес и контакты</b>\n\n'
        'Астана, пр. Примерный, 1\n'
        'Ежедневно с 10:00 до 20:00\n'
        '+7 700 000 00 00\n\n'
        '<i>Адрес и телефон вымышленные.</i>'
    )
    return text, [[button('✂️ Записаться', 's')], [button('‹ В меню', 'menu')]]


def screen_for(data):
    """Экран по данным нажатой кнопки. Непонятные или устаревшие данные ведут в меню."""
    action, *args = data.split(':')
    simple = {'menu': lambda: menu_screen(greeting=False), 's': services_screen, 'price': price_screen, 'addr': address_screen}
    if action in simple and not args:
        return simple[action]()

    service = args[0] if args else None
    master = args[1] if len(args) > 1 else None
    if service not in SERVICES:
        return menu_screen(greeting=False)
    if action == 'm' and len(args) == 1:
        return masters_screen(service)
    if master not in MASTERS:
        return masters_screen(service)
    if action == 'd' and len(args) == 2:
        return days_screen(service, master)

    day = parse_day(args[2]) if len(args) > 2 else None
    if day is None:  # день прошёл, пока клиент выбирал: предлагаем выбрать заново
        return days_screen(service, master)
    if action == 't' and len(args) == 3:
        return times_screen(service, master, day)

    slot = f'{args[3][:2]}:{args[3][2:]}' if len(args) == 4 else None
    if slot not in SLOTS:
        return times_screen(service, master, day)
    screens = {'c': confirm_screen, 'ok': done_screen, 'x': cancelled_screen}
    if action in screens:
        return screens[action](service, master, day, slot)
    return menu_screen(greeting=False)


# ---------- обработка сообщений ----------

def handle_update(update, send=call):
    """Отвечает на одно событие от Telegram: сообщение или нажатие кнопки."""
    query = update.get('callback_query')
    if query:
        text, keyboard = screen_for(query.get('data') or '')
        message = query.get('message') or {}
        send('answerCallbackQuery', callback_query_id=query['id'])
        if message.get('chat'):
            send(
                'editMessageText', chat_id=message['chat']['id'], message_id=message['message_id'],
                text=text, parse_mode='HTML', reply_markup={'inline_keyboard': keyboard},
                disable_web_page_preview=True,
            )
        return

    message = update.get('message')
    if message and message.get('chat', {}).get('type') == 'private':
        text, keyboard = menu_screen(greeting=(message.get('text') or '').startswith('/start'))
        send(
            'sendMessage', chat_id=message['chat']['id'], text=text, parse_mode='HTML',
            reply_markup={'inline_keyboard': keyboard}, disable_web_page_preview=True,
        )


# ---------- запуск вместе с сайтом ----------

WSGI_SERVERS = ('gunicorn', 'uwsgi', 'uvicorn', 'daphne', 'hypercorn', 'waitress')


def webhook_url():
    return settings.SITE_URL.rstrip('/') + WEBHOOK_PATH


def connect_webhook(drop_pending=False):
    """Подключает бота к сайту. Если он уже подключён к этому адресу, ничего не делает."""
    info = call('getWebhookInfo')
    if info is None:
        return False
    if info.get('url') == webhook_url() and not drop_pending:
        return True
    ok = call(
        'setWebhook', url=webhook_url(), secret_token=webhook_secret(),
        allowed_updates=['message', 'callback_query'], drop_pending_updates=drop_pending,
    )
    if ok:
        call('setMyCommands', commands=[{'command': 'start', 'description': 'Начать запись'}])
        log.info('demo bot: webhook connected to %s', webhook_url())
    return bool(ok)


def say(text):
    print(text, flush=True)  # сразу в консоль сервера, без буфера


def wait_for_turn():
    """Ждёт, пока бот не освободится: забирать сообщения у Telegram может только один процесс.

    Если на компьютере запущено два сервера сайта, оба стартуют бота. Второй ждёт здесь
    и подхватывает работу, когда первый остановится. Замок - файл, занятый процессом.
    """
    try:
        import fcntl
    except ImportError:  # Windows: замка нет, запускайте один сервер
        return None
    folder = '/tmp' if os.path.isdir('/tmp') else tempfile.gettempdir()
    lock = open(os.path.join(folder, f'demo-bot-{webhook_secret()[:12]}.lock'), 'w')
    fcntl.flock(lock, fcntl.LOCK_EX)
    return lock  # файл остаётся открытым, пока жив процесс


def poll(announce=say):
    """Локальная работа: бот сам забирает сообщения у Telegram, пока не подключат вебхук."""
    lock = wait_for_turn()  # noqa: F841 - держит замок до конца работы
    hook = (call('getWebhookInfo') or {}).get('url')
    if hook:
        announce(f'Демо-бот работает на сервере ({hook}), локально не запускается.')
        return
    announce(f'Демо-бот запущен: https://t.me/{settings.DEMO_BOT_USERNAME}')

    offset = None
    while True:
        # timeout - сколько Telegram держит запрос открытым в ожидании новых сообщений
        params = {'timeout': 30, 'allowed_updates': ['message', 'callback_query']}
        if offset is not None:
            params['offset'] = offset
        updates = call('getUpdates', http_timeout=40, **params)
        if updates is None:
            # нет сети, либо бота тем временем подключили к серверу - тогда уступаем ему
            time.sleep(5)
            if (call('getWebhookInfo') or {}).get('url'):
                announce('Демо-бот подключён к серверу, локальная работа остановлена.')
                return
            continue
        for update in updates:
            offset = update['update_id'] + 1
            try:
                handle_update(update)
            except Exception:
                log.exception('demo bot: update failed')


def autostart():
    """Запускает бота вместе с сайтом. Вызывается при старте Django."""
    if not settings.DEMO_BOT_TOKEN:
        return
    program = os.path.basename(sys.argv[0])
    command = sys.argv[1] if len(sys.argv) > 1 else ''

    if command == 'runserver':
        # у runserver два процесса: один следит за файлами, второй обслуживает сайт.
        # Бот нужен только во втором, иначе он запустится дважды.
        if os.environ.get('RUN_MAIN') == 'true' or '--noreload' in sys.argv:
            threading.Thread(target=poll, name='demo-bot', daemon=True).start()
    elif any(name in program for name in WSGI_SERVERS):
        # в потоке, чтобы запуск сайта не ждал ответа Telegram
        threading.Thread(target=connect_webhook, name='demo-bot', daemon=True).start()
