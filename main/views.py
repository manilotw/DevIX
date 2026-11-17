from django.template.loader import render_to_string
from django.http import Http404, HttpResponse, HttpResponsePermanentRedirect, JsonResponse
from django.views.decorators.http import require_http_methods
from django.core.mail import send_mail
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from .forms import ContactForm
from .cases import CASES, _translator, case_cards, case_context
from .services import SERVICES, FAQ, service_context
from .demos import DEMOS, demo_cards
from .seo import localized_path, render_page, robots_txt, sitemap_xml, split_lang
from . import bot
from .demo_i18n import translate as translate_demo
import json

HOME_FAQ = [(f'faq{i}_question', f'faq{i}_answer') for i in range(1, 6)]


# услуги в том же порядке, что на главной: (ключ названия, адрес)
SERVICE_CATALOG = [
    ('svc1_title', '/services/landing/'), ('svc3_title', '/services/online-store/'),
    ('svc2_title', '/services/corporate/'), ('svc5_title', '/telegram-bots/'),
    ('svc7_title', '/services/ai-agents/'), ('svc4_title', '/services/web-apps/'),
    ('svc6_title', '/services/automation/'), ('svc8_title', '/services/diploma/'),
]


def card_items(cards):
    """Карточки кейсов или демо как список для микроразметки."""
    return [(card['title']['key'], card['url']) for card in cards]


def index(request):
    lang, _ = split_lang(request.path)
    return render_page(
        request, 'index.html', {'cases': case_cards(limit=3), 'demos': demo_cards(lang)},
        title='page_title_index', description='meta_desc_index', faq=HOME_FAQ, catalog=SERVICE_CATALOG,
    )

def portfolio(request):
    cards = case_cards()
    return render_page(
        request, 'portfolio.html', {'cases': cards},
        title='page_title_portfolio', description='meta_desc_portfolio',
        crumbs=[('nav_portfolio', '/portfolio/')], items=card_items(cards), page_type='CollectionPage',
    )

def calculator(request):
    return render_page(
        request, 'calculator.html',
        title='page_title_calculator', description='meta_desc_calculator',
        crumbs=[('nav_pricing', '/calculator/')],
    )

def aboutus(request):
    return render_page(
        request, 'aboutus.html',
        title='page_title_aboutus', description='meta_desc_aboutus',
        crumbs=[('nav_about', '/aboutus/')], page_type='AboutPage',
    )

def telegram_bots(request):
    return render_page(
        request, 'telegram-bots.html',
        title='page_title_telegram', description='meta_desc_telegram',
        crumbs=[('nav_telegram', '/telegram-bots/')],
        service=(('tgbots_title1', 'tgbots_title2'), 'tgbots_subtitle'),
    )

def contacts(request):
    return render_page(
        request, 'contacts.html',
        title='page_title_contacts', description='meta_desc_contacts',
        crumbs=[('nav_contacts', '/contacts/')], page_type='ContactPage',
    )

def case(request, slug):
    context = case_context(slug)
    if context is None:
        raise Http404
    # услуги, в примерах которых показан этот кейс: ссылки на них со страницы кейса
    t = _translator()
    context['services'] = [
        {'url': f'/services/{service_slug}/', 'title': t(f"sp_{config['key']}_h1")}
        for service_slug, config in SERVICES.items() if slug in config['projects']
    ]
    return render_page(
        request, 'case.html', context,
        title=context['page_title']['key'], description=context['desc']['key'],
        image=context['image'],
        crumbs=[('nav_portfolio', '/portfolio/'), (context['title']['key'], f'/portfolio/{slug}/')],
        work=(context['title']['key'], context['desc']['key']),
    )

def service(request, slug):
    context = service_context(slug)
    if context is None:
        raise Http404
    p = f"sp_{SERVICES[slug]['key']}"
    return render_page(
        request, 'service.html', context,
        title=f'{p}_page_title', description=f'{p}_meta',
        crumbs=[(f'{p}_h1', f'/services/{slug}/')],
        service=((f'{p}_h1',), f'{p}_sub'),
        faq=[(f'{p}_faq{i}_q', f'{p}_faq{i}_a') for i in range(1, FAQ + 1)],
    )

def demo(request):
    lang, _ = split_lang(request.path)
    cards = demo_cards(lang)
    return render_page(
        request, 'demo.html', {'demos': cards},
        title='page_title_demo', description='meta_desc_demo',
        crumbs=[('nav_demo', '/demo/')], items=card_items(cards), page_type='CollectionPage',
    )

def demo_project(request, slug):
    """Отдельное демо: самостоятельная страница со своим дизайном.

    Шаблоны написаны по-русски, для /en/... страница переводится по словарю.
    """
    if slug not in DEMOS:
        raise Http404
    lang, _ = split_lang(request.path)
    page = render_to_string(f'demo/{slug}.html', {
        'back_url': localized_path(lang, '/demo/'),
        'contact_url': localized_path(lang, '/contacts/'),
    }, request)
    return HttpResponse(translate_demo(page, slug) if lang == 'en' else page)

def page_not_found(request, exception=None):
    return render_page(
        request, '404.html',
        title='page_title_404', description='nf_text', noindex=True, status=404,
    )

def ru_redirect(request, rest=''):
    """Русская версия живёт без префикса: /ru/portfolio/ -> /portfolio/.

    Для поисковиков редирект постоянный (301), но браузер помнит его только час:
    без этого заголовка он запомнил бы редирект навсегда, и вернуть адреса /ru/
    было бы нельзя.
    """
    url = '/' + (rest or '')
    if not url.endswith('/'):
        url += '/'
    if request.META.get('QUERY_STRING'):
        url += '?' + request.META['QUERY_STRING']
    response = HttpResponsePermanentRedirect(url)
    response['Cache-Control'] = 'max-age=3600'
    return response

def robots(request):
    return HttpResponse(robots_txt(), content_type='text/plain; charset=utf-8')

def sitemap(request):
    paths = ['/', '/portfolio/', '/demo/', '/calculator/', '/aboutus/', '/telegram-bots/', '/contacts/']
    paths += [f'/services/{slug}/' for slug in SERVICES]
    paths += [f'/portfolio/{slug}/' for slug in CASES]
    return HttpResponse(sitemap_xml(paths), content_type='application/xml; charset=utf-8')

@csrf_exempt
@require_http_methods(["POST"])
def telegram_demo_bot(request):
    """Вебхук демо-бота записи: Telegram присылает сюда сообщения и нажатия кнопок."""
    secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token', '')
    if not settings.DEMO_BOT_TOKEN or secret != bot.webhook_secret():
        return HttpResponse(status=403)
    try:
        bot.handle_update(json.loads(request.body))
    except Exception:
        # Telegram повторяет запрос, пока не получит 200: на ошибке в одном
        # сообщении бот не должен застревать
        bot.log.exception('demo bot: update failed')
    return HttpResponse('ok')

@csrf_exempt
@require_http_methods(["POST"])
def send_contact_email(request):
    """Отправляет заявку по электронной почте"""
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip()
        name = data.get('name', 'Посетитель сайта').strip()
        message = data.get('message', '').strip()
        
        if not email:
            return JsonResponse({'success': False, 'error': 'Email не указан'}, status=400)
        
        # Формируем письмо
        subject = f'Новая заявка со страницы сайта - {name}'
        body = f"""
Новая заявка с сайта DevIX

Имя: {name}
Email: {email}
Сообщение: {message if message else '(не указано)'}

---
Это автоматическое письмо, ответьте напрямую на адрес {email}
        """
        
        # Отправляем письмо
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[settings.CONTACT_EMAIL],
            fail_silently=False,
        )
        
        return JsonResponse({'success': True, 'message': 'Заявка отправлена успешно!'})
    
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Ошибка при обработке данных'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': f'Ошибка при отправке: {str(e)}'}, status=500)
