"""SEO: язык страницы по адресу, мета-теги, canonical и hreflang, микроразметка
и перевод HTML на сервере.

Русская версия живёт по адресу без префикса (/portfolio/), английская - с /en/.
Сервер сразу отдаёт страницу на языке адреса: поисковик и соцсети видят готовый
текст, а браузеру не нужно скачивать переводы и перерисовывать страницу.
Тексты - те же static/js/ru.json и en.json, что использует скрипт в браузере.
"""
import html
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape as xml_escape

from django.conf import settings
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.templatetags.static import static

TEXTS_DIR = Path(__file__).resolve().parent / 'static' / 'js'

DEFAULT_LANG = 'ru'
LANGS = ('ru', 'en')
OG_LOCALES = {'ru': 'ru_RU', 'en': 'en_US'}
OG_IMAGES = {'ru': 'img/og-ru.png', 'en': 'img/og-en.png'}
OG_IMAGE_SIZE = (1200, 630)

PHONE = '+77776183053'
EMAIL = 'manilotcollab@gmail.com'
SOCIAL = ['https://www.instagram.com/devixco', 'https://t.me/devixco']

_texts = {}


def texts(lang):
    """Переводы языка. Файл перечитывается, только если он изменился."""
    path = TEXTS_DIR / f'{lang}.json'
    mtime = path.stat().st_mtime
    cached = _texts.get(lang)
    if cached is None or cached[0] != mtime:
        with open(path, encoding='utf-8') as f:
            cached = (mtime, json.load(f))
        _texts[lang] = cached
    return cached[1]


# ---------- адреса ----------

def split_lang(path):
    """'/en/portfolio/' -> ('en', '/portfolio/'). Адрес без префикса - русский."""
    if path == '/en' or path.startswith('/en/'):
        return 'en', path[3:] or '/'
    return DEFAULT_LANG, path


def localized_path(lang, path):
    return path if lang == DEFAULT_LANG else f'/{lang}{path}'


def absolute(path):
    return settings.SITE_URL.rstrip('/') + path


def alternates(path):
    """Адреса страницы на всех языках для hreflang."""
    links = [{'lang': lang, 'url': absolute(localized_path(lang, path))} for lang in LANGS]
    links.append({'lang': 'x-default', 'url': absolute(path)})
    return links


# ---------- микроразметка schema.org ----------

def _organization():
    return {
        '@type': 'Organization',
        '@id': absolute('/#organization'),
        'name': 'DevIX',
        'url': absolute('/'),
        'logo': absolute(static('img/devixlogo.png')),
        'email': EMAIL,
        'telephone': PHONE,
        'sameAs': SOCIAL,
        'areaServed': 'Worldwide',
        'knowsLanguage': ['ru', 'en'],
        'contactPoint': {
            '@type': 'ContactPoint',
            'telephone': PHONE,
            'email': EMAIL,
            'contactType': 'customer service',
            'availableLanguage': ['Russian', 'English'],
        },
    }


def _website(lang):
    return {
        '@type': 'WebSite',
        '@id': absolute('/#website'),
        'url': absolute(localized_path(lang, '/')),
        'name': 'DevIX',
        'inLanguage': lang,
        'publisher': {'@id': absolute('/#organization')},
    }


def _breadcrumbs(lang, t, crumbs):
    items = [('nav_home', '/')] + list(crumbs)
    return {
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {
                '@type': 'ListItem',
                'position': i,
                'name': t.get(key, ''),
                'item': absolute(localized_path(lang, path)),
            }
            for i, (key, path) in enumerate(items, 1)
        ],
    }


def _faq(t, pairs):
    return {
        '@type': 'FAQPage',
        'mainEntity': [
            {
                '@type': 'Question',
                'name': t.get(question, ''),
                'acceptedAnswer': {'@type': 'Answer', 'text': t.get(answer, '')},
            }
            for question, answer in pairs
        ],
    }


def _service(t, name_keys, desc_key, url):
    return {
        '@type': 'Service',
        'name': ' '.join(t.get(key, '') for key in name_keys),
        'description': t.get(desc_key, ''),
        'url': url,
        'provider': {'@id': absolute('/#organization')},
    }


def _json_ld(nodes):
    data = json.dumps({'@context': 'https://schema.org', '@graph': nodes}, ensure_ascii=False)
    return data.replace('<', '\\u003c')  # чтобы текст не мог закрыть тег <script>


# ---------- перевод готового HTML ----------

# <тег ... data-i18n="ключ" ...>текст</тег> - как в браузере: текст элемента целиком
_I18N_TEXT = re.compile(r'(<([a-zA-Z0-9]+)\b[^<>]*\sdata-i18n="([^"]+)"[^<>]*>)([^<]*)(?=</\2>)')
_I18N_LABEL = re.compile(r'<[^<>]*\sdata-i18n-label="([^"]+)"[^<>]*>')
_I18N_ALT = re.compile(r'<[^<>]*\sdata-i18n-alt="([^"]+)"[^<>]*>')
_ALT = re.compile(r'(\salt=")[^"]*(")')
_DATA_LABEL = re.compile(r'(\sdata-label=")[^"]*(")')
# внутренние ссылки без языка; статика, админка и API остаются как есть
_INTERNAL_HREF = re.compile(r'href="/(?!/|(?:en|ru|static|admin|api)(?:/|"))')


def localize(page, lang):
    """Подставляет в HTML тексты языка и ведёт ссылки на страницы этого же языка."""
    t = texts(lang)

    def text(match):
        value = t.get(match.group(3))
        if not value:
            return match.group(0)
        return match.group(1) + html.escape(value, quote=False)

    def label(match):
        value = t.get(match.group(1))
        if not value:
            return match.group(0)
        return _DATA_LABEL.sub(lambda m: m.group(1) + html.escape(value) + m.group(2), match.group(0))

    def alt(match):
        value = t.get(match.group(1))
        if not value:
            return match.group(0)
        return _ALT.sub(lambda m: m.group(1) + html.escape(value) + m.group(2), match.group(0))

    page = _I18N_TEXT.sub(text, page)
    page = _I18N_LABEL.sub(label, page)
    page = _I18N_ALT.sub(alt, page)
    if lang != DEFAULT_LANG:
        page = _INTERNAL_HREF.sub(f'href="/{lang}/', page)
    return page


# ---------- страница ----------

def render_page(request, template, context=None, *, title, description, image=None,
                crumbs=None, faq=None, service=None, catalog=None, items=None, work=None,
                page_type='WebPage', noindex=False, status=200):
    """Отдаёт страницу на языке адреса вместе с мета-тегами и микроразметкой.

    title, description - ключи переводов заголовка и описания страницы
    image       - картинка для соцсетей (путь в static), по умолчанию общая обложка
    crumbs      - хлебные крошки после «Главной»: [(ключ названия, адрес без языка)]
    faq         - вопросы и ответы страницы: [(ключ вопроса, ключ ответа)]
    service     - услуга на странице: (ключи названия, ключ описания)
    catalog     - список услуг компании: [(ключ названия, адрес без языка)]
    items       - список на странице (кейсы, демо): [(ключ названия, адрес без языка)]
    work        - выполненная работа на странице (кейс): (ключ названия, ключ описания)
    page_type   - тип страницы в schema.org: WebPage, AboutPage, ContactPage, CollectionPage
    """
    lang, path = split_lang(request.path)
    t = texts(lang)
    canonical = absolute(localized_path(lang, path))
    picture = absolute(static(image or OG_IMAGES[lang]))
    organization_id = {'@id': absolute('/#organization')}

    organization = _organization()
    organization['description'] = t.get('meta_desc_index', '')
    if catalog:
        organization['hasOfferCatalog'] = {
            '@type': 'OfferCatalog',
            'name': t.get('services_title', ''),
            'itemListElement': [
                {
                    '@type': 'Offer',
                    'itemOffered': {
                        '@type': 'Service',
                        'name': t.get(key, ''),
                        'url': absolute(localized_path(lang, item_path)),
                    },
                }
                for key, item_path in catalog
            ],
        }

    nodes = [organization, _website(lang), {
        '@type': page_type,
        '@id': canonical + '#webpage',
        'url': canonical,
        'name': t.get(title) or 'DevIX',
        'description': t.get(description, ''),
        'inLanguage': lang,
        'isPartOf': {'@id': absolute('/#website')},
        'about': organization_id,
        'primaryImageOfPage': picture,
    }]
    if crumbs:
        nodes.append(_breadcrumbs(lang, t, crumbs))
    if service:
        nodes.append(_service(t, service[0], service[1], canonical))
    if items:
        nodes.append({
            '@type': 'ItemList',
            'itemListElement': [
                {
                    '@type': 'ListItem',
                    'position': i,
                    'name': t.get(key, ''),
                    'url': absolute(localized_path(lang, item_path)),
                }
                for i, (key, item_path) in enumerate(items, 1)
            ],
        })
    if work:
        nodes.append({
            '@type': 'CreativeWork',
            'name': t.get(work[0], ''),
            'description': t.get(work[1], ''),
            'url': canonical,
            'image': picture,
            'inLanguage': lang,
            'creator': organization_id,
        })
    if faq:
        nodes.append(_faq(t, faq))

    meta = {
        'lang': lang,
        'title_key': title,
        'title': t.get(title) or 'DevIX',
        'description': t.get(description, ''),
        'canonical': canonical,
        'alternates': alternates(path),
        'image': picture,
        'image_size': None if image else OG_IMAGE_SIZE,
        'locale': OG_LOCALES[lang],
        'other_locales': [OG_LOCALES[other] for other in LANGS if other != lang],
        'noindex': noindex,
        'json_ld': _json_ld(nodes),
        'google_verification': settings.GOOGLE_SITE_VERIFICATION,
        'yandex_verification': settings.YANDEX_VERIFICATION,
    }
    page = render_to_string(template, {**(context or {}), 'meta': meta}, request)
    return HttpResponse(localize(page, lang), status=status)


# ---------- robots.txt и sitemap.xml ----------

def robots_txt():
    closed = ['Disallow: /admin/', 'Disallow: /api/']
    return '\n'.join([
        'User-agent: *', *closed,
        '',
        # Яндекс: адреса с рекламными метками - та же страница, а не дубль
        'User-agent: Yandex', *closed,
        'Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&yclid&gclid&fbclid',
        '',
        f"Sitemap: {absolute('/sitemap.xml')}",
        '',
    ])


def sitemap_xml(paths):
    """Карта сайта: каждая страница на каждом языке со ссылками на остальные языки."""
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ]
    # дата изменения - когда последний раз правили тексты сайта
    changed = max((TEXTS_DIR / f'{lang}.json').stat().st_mtime for lang in LANGS)
    lastmod = datetime.fromtimestamp(changed, timezone.utc).strftime('%Y-%m-%d')
    for path in paths:
        links = ''.join(
            f'<xhtml:link rel="alternate" hreflang="{link["lang"]}" href="{xml_escape(link["url"])}"/>'
            for link in alternates(path)
        )
        for lang in LANGS:
            loc = xml_escape(absolute(localized_path(lang, path)))
            lines.append(f'<url><loc>{loc}</loc><lastmod>{lastmod}</lastmod>{links}</url>')
    lines.append('</urlset>')
    return '\n'.join(lines) + '\n'
