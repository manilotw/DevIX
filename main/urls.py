from django.urls import path
from .views import index, portfolio, calculator, aboutus, telegram_bots, contacts, service, case, send_contact_email

urlpatterns = [
    # Default routes (Russian)
    path('', index, name='index'),
    path('portfolio/', portfolio, name='portfolio'),
    path('portfolio/<slug:slug>/', case, name='case'),
    path('calculator/', calculator, name='calculator'),
    path('aboutus/', aboutus, name='aboutus'),
    path('telegram-bots/', telegram_bots, name='telegram_bots'),
    path('contacts/', contacts, name='contacts'),
    path('services/<slug:slug>/', service, name='service'),
    
    # Russian routes
    path('ru/', index, name='index_ru'),
    path('ru/portfolio/', portfolio, name='portfolio_ru'),
    path('ru/portfolio/<slug:slug>/', case, name='case_ru'),
    path('ru/calculator/', calculator, name='calculator_ru'),
    path('ru/aboutus/', aboutus, name='aboutus_ru'),
    path('ru/telegram-bots/', telegram_bots, name='telegram_bots_ru'),
    path('ru/contacts/', contacts, name='contacts_ru'),
    path('ru/services/<slug:slug>/', service, name='service_ru'),
    
    # English routes
    path('en/', index, name='index_en'),
    path('en/portfolio/', portfolio, name='portfolio_en'),
    path('en/portfolio/<slug:slug>/', case, name='case_en'),
    path('en/calculator/', calculator, name='calculator_en'),
    path('en/aboutus/', aboutus, name='aboutus_en'),
    path('en/telegram-bots/', telegram_bots, name='telegram_bots_en'),
    path('en/contacts/', contacts, name='contacts_en'),
    path('en/services/<slug:slug>/', service, name='service_en'),
    
    # API
    path('api/send-contact/', send_contact_email, name='send_contact_email'),
]