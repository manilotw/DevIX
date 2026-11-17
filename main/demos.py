"""Демо-проекты: страница со списком и сами демо.

Каждое демо - отдельная страница без бэкенда (HTML, CSS и JS в templates/demo и
static/demo): данные вымышленные и нигде не сохраняются. Тексты карточек лежат в
static/js/ru.json и en.json, как у остальных страниц.
"""
from .cases import _translator

# slug в адресе -> настройки карточки. Порядок здесь - порядок карточек на странице.
#   key   - префикс ключей переводов (demo_<key>_...)
#   image - превью демо
#   tries - сколько пунктов в списке «Что попробовать»
DEMOS = {
    'landing': {'key': 'landing', 'image': 'img/demo/landing.jpg', 'tries': 3},
    'shop': {'key': 'shop', 'image': 'img/demo/shop.jpg', 'tries': 3},
    'crm': {'key': 'crm', 'image': 'img/demo/crm.jpg', 'tries': 3},
    'ai-agent': {'key': 'ai', 'image': 'img/demo/ai-agent.jpg', 'tries': 3},
    'telegram-bot': {'key': 'bot', 'image': 'img/demo/telegram-bot.jpg', 'tries': 3},
}


def demo_cards():
    """Карточки демо для главной и страницы со списком."""
    t = _translator()
    cards = []
    for slug, config in DEMOS.items():
        p = f"demo_{config['key']}"
        cards.append({
            'url': f'/demo/{slug}/',
            'image': config['image'],
            'tag': t(f'{p}_tag'),
            'title': t(f'{p}_title'),
            'desc': t(f'{p}_desc'),
            'tries': [t(f'{p}_try{i}') for i in range(1, config['tries'] + 1)],
        })
    return cards
