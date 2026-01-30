from django.urls import path
from .views import index, portfolio, calculator, aboutus, telegram_bots, send_contact_email

urlpatterns = [
    # Default routes (Russian)
    path('', index, name='index'),
    path('portfolio/', portfolio, name='portfolio'),
    path('calculator/', calculator, name='calculator'),
    path('aboutus/', aboutus, name='aboutus'),
    path('telegram-bots/', telegram_bots, name='telegram_bots'),
    
    # Russian routes
    path('ru/', index, name='index_ru'),
    path('ru/portfolio/', portfolio, name='portfolio_ru'),
    path('ru/calculator/', calculator, name='calculator_ru'),
    path('ru/aboutus/', aboutus, name='aboutus_ru'),
    path('ru/telegram-bots/', telegram_bots, name='telegram_bots_ru'),
    
    # English routes
    path('en/', index, name='index_en'),
    path('en/portfolio/', portfolio, name='portfolio_en'),
    path('en/calculator/', calculator, name='calculator_en'),
    path('en/aboutus/', aboutus, name='aboutus_en'),
    path('en/telegram-bots/', telegram_bots, name='telegram_bots_en'),
    
    # API
    path('api/send-contact/', send_contact_email, name='send_contact_email'),
]