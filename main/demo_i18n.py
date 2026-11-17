"""Английская версия демо-проектов.

Шаблоны и скрипты демо написаны по-русски. Для адресов /en/demo/... готовая
страница переводится по словарю main/demo_en/<демо>.json (плюс общий common.json):
ключ - русская строка, значение - английская.

- В HTML заменяются тексты между тегами и подписи в атрибутах, если строка целиком
  есть в словаре.
- Скриптам словарь передаётся в window.DEMO_T; строки в них обёрнуты в t('...')
  (функция window.demoText в templates/demo/_bar.html).

Строка, которой нет в словаре, останется русской - добавьте её в json.
"""
import html
import json
import re
from functools import lru_cache
from pathlib import Path

EN_DIR = Path(__file__).resolve().parent / 'demo_en'

_SKIP = re.compile(r'(<script\b.*?</script>|<style\b.*?</style>)', re.S)
_TEXT = re.compile(r'>([^<>]+)<')
_ATTR = re.compile(r'(\s(?:placeholder|aria-label|alt|title|value)=")([^"]+)(")')


@lru_cache(maxsize=None)
def _load(name, mtime):
    with open(EN_DIR / f'{name}.json', encoding='utf-8') as f:
        return json.load(f)


def table(slug):
    """Словарь демо вместе с общими строками. Файлы перечитываются, если изменились."""
    result = {}
    for name in ('common', slug):
        path = EN_DIR / f'{name}.json'
        if path.exists():
            result.update(_load(name, path.stat().st_mtime))
    return result


def translate(page, slug):
    """Переводит готовую страницу демо на английский."""
    words = table(slug)

    def text(match):
        raw = match.group(1)
        english = words.get(' '.join(raw.split()))
        if english is None:
            return match.group(0)
        lead = raw[:len(raw) - len(raw.lstrip())]
        tail = raw[len(raw.rstrip()):]
        return f'>{lead}{html.escape(english, quote=False)}{tail}<'

    def attr(match):
        english = words.get(html.unescape(match.group(2)))
        if english is None:
            return match.group(0)
        return match.group(1) + html.escape(english) + match.group(3)

    parts = _SKIP.split(page)
    for i in range(0, len(parts), 2):  # нечётные части - скрипты и стили, их не трогаем
        parts[i] = _ATTR.sub(attr, _TEXT.sub(text, parts[i]))
    page = ''.join(parts).replace('<html lang="ru">', '<html lang="en">', 1)

    data = json.dumps(words, ensure_ascii=False).replace('</', '<\\/')
    return page.replace('</head>', f'  <script>window.DEMO_T = {data};</script>\n</head>', 1)
