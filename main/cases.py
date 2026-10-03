"""Кейсы портфолио: карточки в списках и страницы кейсов.

Тексты лежат в static/js/ru.json и en.json: сервер подставляет русский текст
по умолчанию, язык переключается на клиенте по data-i18n.
"""
import json
from pathlib import Path

RU_TEXTS = Path(__file__).resolve().parent / 'static' / 'js' / 'ru.json'

# slug в адресе -> настройки кейса. Порядок здесь - порядок карточек в портфолио.
#   key      - префикс ключей переводов страницы (case_<key>_...)
#   project  - номер проекта (название и краткое описание: portfolio_project<N>_...)
#   tag      - надпись в углу карточки: название компании или 'NDA'
#   about / done / result - сколько абзацев и пунктов списка в каждом разделе
# Только для открытых кейсов:
#   image    - скриншот (без него показывается чёрная обложка с названием кейса)
#   client   - название клиента на странице кейса
#   stack    - технологии
# У кейса под NDA нет скриншота, названия клиента и стека; раздел называется
# «О проекте» и начинается с общей фразы про NDA.
CASES = {
    'a1-cleaning': {
        'key': 'a1',
        'project': 4,
        'image': 'img/sitepicture/a1cleaning.png',
        'tag': 'A1 Cleaning',
        'client': 'A1 Cleaning Services',
        'stack': ['HTML', 'CSS', 'JavaScript', 'Python'],
        'about': 2,
        'done': 8,
        'result': 2,
    },
    'ai-agent-1c': {'key': 'ai1c', 'project': 7, 'tag': 'NDA', 'about': 1, 'done': 8, 'result': 2},
    'confectionery-store': {'key': 'cake', 'project': 1, 'tag': 'NDA', 'about': 1, 'done': 6, 'result': 1},
    'cash-flow-app': {'key': 'dds', 'project': 2, 'tag': 'NDA', 'about': 1, 'done': 4, 'result': 1},
    'food-delivery': {'key': 'burger', 'project': 3, 'tag': 'NDA', 'about': 1, 'done': 4, 'result': 1},
    'recipe-portal': {'key': 'recipes', 'project': 5, 'tag': 'NDA', 'about': 1, 'done': 5, 'result': 1},
    'blog-platform': {'key': 'blog', 'project': 6, 'tag': 'NDA', 'about': 1, 'done': 5, 'result': 1},
}

NDA = 'NDA'


def _translator():
    with open(RU_TEXTS, encoding='utf-8') as f:
        texts = json.load(f)

    def t(key):
        return {'key': key, 'text': texts.get(key, '')}

    return t


def _card(slug, t):
    config = CASES[slug]
    n = config['project']
    return {
        'url': f'/portfolio/{slug}',
        'tag': config.get('tag'),
        'title': t(f'portfolio_project{n}_title'),
        'desc': t(f'portfolio_project{n}_desc'),
        'image': config.get('image'),
    }


def case_cards(slugs=None, limit=None):
    """Карточки кейсов для списков: все по порядку или только указанные."""
    t = _translator()
    slugs = list(CASES) if slugs is None else [s for s in slugs if s in CASES]
    return [_card(slug, t) for slug in slugs[:limit]]


def case_context(slug):
    """Контекст шаблона case.html или None, если такого кейса нет."""
    config = CASES.get(slug)
    if config is None:
        return None

    t = _translator()
    p = f"case_{config['key']}"
    card = _card(slug, t)

    nda = config.get('tag') == NDA
    about = [t(f'{p}_about{i}') for i in range(1, config['about'] + 1)]

    return {
        'page_title': t(f'{p}_page_title'),
        'title': card['title'],
        'desc': card['desc'],
        'image': card['image'],
        'client': NDA if nda else config.get('client'),
        'format': t(f'{p}_format'),
        'stack': [] if nda else config.get('stack', []),
        'about_title': t('case_project_title' if nda else 'case_about_title'),
        'about': [t('case_nda_note')] + about if nda else about,
        'done_intro': t(f'{p}_done_intro'),
        'done': [t(f'{p}_done{i}') for i in range(1, config['done'] + 1)],
        'result': [t(f'{p}_result{i}') for i in range(1, config['result'] + 1)],
    }
