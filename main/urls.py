from django.urls import path, re_path
from .views import (
    index, portfolio, calculator, aboutus, telegram_bots, contacts, service, case,
    demo, demo_project, send_contact_email, telegram_demo_bot, ru_redirect, robots, sitemap,
)

urlpatterns = [
    # Russian routes (default language, no prefix)
    path('', index, name='index'),
    path('portfolio/', portfolio, name='portfolio'),
    path('portfolio/<slug:slug>/', case, name='case'),
    path('demo/', demo, name='demo'),
    path('demo/<slug:slug>/', demo_project, name='demo_project'),
    path('calculator/', calculator, name='calculator'),
    path('aboutus/', aboutus, name='aboutus'),
    path('telegram-bots/', telegram_bots, name='telegram_bots'),
    path('contacts/', contacts, name='contacts'),
    path('services/<slug:slug>/', service, name='service'),

    # Old /ru/... addresses: permanent redirect to the address without prefix
    re_path(r'^ru(?:/(?P<rest>.*))?$', ru_redirect, name='ru_redirect'),

    # English routes
    path('en/', index, name='index_en'),
    path('en/portfolio/', portfolio, name='portfolio_en'),
    path('en/portfolio/<slug:slug>/', case, name='case_en'),
    path('en/demo/', demo, name='demo_en'),
    path('en/demo/<slug:slug>/', demo_project, name='demo_project_en'),
    path('en/calculator/', calculator, name='calculator_en'),
    path('en/aboutus/', aboutus, name='aboutus_en'),
    path('en/telegram-bots/', telegram_bots, name='telegram_bots_en'),
    path('en/contacts/', contacts, name='contacts_en'),
    path('en/services/<slug:slug>/', service, name='service_en'),

    # Search engines
    path('robots.txt', robots, name='robots'),
    path('sitemap.xml', sitemap, name='sitemap'),

    # API
    path('api/send-contact/', send_contact_email, name='send_contact_email'),
    path('api/telegram/demo-bot/', telegram_demo_bot, name='telegram_demo_bot'),
]
