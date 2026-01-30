// Функция для отправки контактной формы на почту
function sendContactForm(inputId, buttonEl) {
    if (buttonEl) {
        buttonEl.classList.add('is-pressed');
        setTimeout(() => buttonEl.classList.remove('is-pressed'), 80);
    }

    const emailInput = document.getElementById(inputId);
    const email = emailInput ? emailInput.value.trim() : '';
    
    if (!email) {
        alert('Пожалуйста, введите ваш адрес электронной почты');
        return;
    }
    
    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Пожалуйста, введите корректный адрес электронной почты');
        return;
    }
    
    // Подготавливаем данные
    const data = {
        email: email,
        name: '',
        message: 'Пользователь оставил заявку с сайта'
    };
    
    // Отправляем запрос на сервер
    fetch('/api/send-contact/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.');
            emailInput.value = '';
        } else {
            alert('Ошибка при отправке заявки: ' + (data.error || 'Неизвестная ошибка'));
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Ошибка при отправке заявки. Пожалуйста, попробуйте позже.');
    });
}
