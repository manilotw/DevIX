from django.shortcuts import render
from django.http import Http404, JsonResponse
from django.views.decorators.http import require_http_methods
from django.core.mail import send_mail
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from .forms import ContactForm
from .cases import case_cards, case_context
from .services import service_context
import json

def index(request):
    return render(request, 'index.html', {'cases': case_cards(limit=3)})

def portfolio(request):
    return render(request, 'portfolio.html', {'cases': case_cards()})

def calculator(request):
    return render(request, 'calculator.html')

def aboutus(request):
    return render(request, 'aboutus.html')

def telegram_bots(request):
    return render(request, 'telegram-bots.html')

def contacts(request):
    return render(request, 'contacts.html')

def case(request, slug):
    context = case_context(slug)
    if context is None:
        raise Http404
    return render(request, 'case.html', context)

def service(request, slug):
    context = service_context(slug)
    if context is None:
        raise Http404
    return render(request, 'service.html', context)

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
