"""Страницы услуг: структура каждой страницы и подготовка данных для шаблона.

Тексты лежат в static/js/ru.json и en.json (как и у остальных страниц): сервер
подставляет русский текст по умолчанию, язык переключается на клиенте по data-i18n.
"""
import json
from pathlib import Path

from .cases import case_cards

RU_TEXTS = Path(__file__).resolve().parent / 'static' / 'js' / 'ru.json'

# slug в адресе -> настройки страницы
#   key       - префикс ключей переводов (sp_<key>_...)
#   solutions - иконки карточек «что мы разрабатываем»
#   benefits  - иконки строк «что это даёт»
#   has_price - есть ли цена «от ...» (она же есть в калькуляторе)
#   projects  - примеры из портфолио (slug кейсов из cases.py)
SERVICES = {
    'landing': {
        'key': 'landing',
        'solutions': ['i-target', 'i-zap', 'i-chat', 'i-pen', 'i-globe', 'i-chart'],
        'benefits': ['i-trend', 'i-zap', 'i-sliders', 'i-refresh'],
        'has_price': True,
        'projects': ['a1-cleaning', 'blog-platform', 'confectionery-store'],
    },
    'corporate': {
        'key': 'corporate',
        'solutions': ['i-award', 'i-sliders', 'i-pen', 'i-star', 'i-globe', 'i-refresh'],
        'benefits': ['i-shield', 'i-sliders', 'i-trend', 'i-chart'],
        'has_price': True,
        'projects': ['blog-platform', 'recipe-portal', 'a1-cleaning'],
    },
    'online-store': {
        'key': 'store',
        'solutions': ['i-cart', 'i-target', 'i-dollar', 'i-sliders', 'i-users', 'i-link'],
        'benefits': ['i-globe', 'i-chart', 'i-refresh', 'i-trend'],
        'has_price': True,
        'projects': ['confectionery-store', 'food-delivery', 'recipe-portal'],
    },
    'web-apps': {
        'key': 'webapp',
        'solutions': ['i-users', 'i-pen', 'i-cart', 'i-chart', 'i-link', 'i-target'],
        'benefits': ['i-target', 'i-trend', 'i-shield', 'i-refresh'],
        'has_price': True,
        'projects': ['cash-flow-app', 'food-delivery', 'recipe-portal'],
    },
    'automation': {
        'key': 'automation',
        'solutions': ['i-users', 'i-dollar', 'i-cart', 'i-chart', 'i-link', 'i-send'],
        'benefits': ['i-zap', 'i-shield', 'i-chart', 'i-trend'],
        'has_price': False,
        'projects': ['ai-agent-1c', 'cash-flow-app', 'food-delivery'],
    },
    'ai-agents': {
        'key': 'ai',
        'solutions': ['i-chat', 'i-cart', 'i-link', 'i-lock', 'i-send', 'i-zap'],
        'benefits': ['i-globe', 'i-users', 'i-target', 'i-shield'],
        'has_price': False,
        'projects': ['ai-agent-1c', 'cash-flow-app', 'food-delivery'],
    },
    'diploma': {
        'key': 'diploma',
        'solutions': ['i-users', 'i-cart', 'i-send', 'i-chat', 'i-link', 'i-pen'],
        'benefits': ['i-target', 'i-award', 'i-chat', 'i-zap'],
        'has_price': False,
        'projects': ['cash-flow-app', 'recipe-portal', 'blog-platform'],
    },
}

STAGES = 6
FAQ = 3


def service_context(slug):
    """Контекст шаблона service.html или None, если такой услуги нет."""
    config = SERVICES.get(slug)
    if config is None:
        return None

    with open(RU_TEXTS, encoding='utf-8') as f:
        texts = json.load(f)

    def t(key):
        return {'key': key, 'text': texts.get(key, '')}

    p = f"sp_{config['key']}"
    custom = '' if config['has_price'] else '_custom'

    return {
        'page_title': t(f'{p}_page_title'),
        'h1': t(f'{p}_h1'),
        'sub': t(f'{p}_sub'),
        'solutions_title': t(f'{p}_sol_title'),
        'solutions': [
            {'icon': icon, 'title': t(f'{p}_sol{i}_t'), 'desc': t(f'{p}_sol{i}_d')}
            for i, icon in enumerate(config['solutions'], 1)
        ],
        'benefits_title': t(f'{p}_ben_title'),
        'benefits': [
            {'icon': icon, 'title': t(f'{p}_ben{i}_t'), 'desc': t(f'{p}_ben{i}_d')}
            for i, icon in enumerate(config['benefits'], 1)
        ],
        'stages': [
            {'num': i, 'title': t(f'sp_stage{i}_t'), 'desc': t(f'sp_stage{i}_d')}
            for i in range(1, STAGES + 1)
        ],
        'has_price': config['has_price'],
        'price': t(f'{p}_price') if config['has_price'] else t('sp_price_custom'),
        'price_text': t(f'sp_price_text{custom}'),
        'term': t(f'sp_term_value{custom}'),
        'projects': case_cards(config['projects']),
        'faq': [
            {'question': t(f'{p}_faq{i}_q'), 'answer': t(f'{p}_faq{i}_a')}
            for i in range(1, FAQ + 1)
        ],
    }
