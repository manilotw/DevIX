// Автоматический переводчик - работает без data-i18n атрибутов
// Находит русский текст на странице и переводит его на нужный язык

function setupAutoTranslator() {
  // Обновляем переводы при загрузке страницы
  window.addEventListener('DOMContentLoaded', function() {
    applyAutoTranslations();
  });
  
  // Также обновляем при изменении языка
  const originalSwitchLanguage = window.switchLanguage;
  window.switchLanguage = function(lang) {
    originalSwitchLanguage(lang);
    // После переключения языка, автоматически переводим все элементы
    setTimeout(() => {
      applyAutoTranslations();
    }, 500);
  };
}

function applyAutoTranslations() {
  if (!translations || Object.keys(translations).length === 0) {
    return;
  }
  
  // Переводим все текстовые узлы
  walkText(document.body, function(node) {
    if (node.nodeValue) {
      const originalText = node.nodeValue.trim();
      
      // Ищем в переводах текст, который совпадает с исходным или похож
      for (const [key, value] of Object.entries(translations)) {
        // Проверяем точное совпадение в транслитерации
        if (originalText && value && node.nodeValue.indexOf(value) !== -1) {
          // Это транслированный текст, пропускаем
          return;
        }
      }
      
      // Пытаемся найти перевод по частичному совпадению русского текста
      const lowerText = originalText.toLowerCase();
      
      // Проверяем известные паттерны и переводим их
      const patterns = {
        'портфолио': 'portfolio_sites_title',
        'каждый проект': 'portfolio_section_subtitle',
        'сайты': 'portfolio_sites_title',
        'часто задаваемые вопросы': 'faq_title',
        'вопросы': 'faq_title_gradient',
        'телефон': 'footer_phone_label',
        'email': 'footer_email_label',
        'whatsapp': 'footer_whatsapp_label',
        'telegram': 'footer_telegram_label',
        'все права защищены': 'footer_copyright',
        'контакты': 'footer_contacts_title',
      };
      
      for (const [pattern, key] of Object.entries(patterns)) {
        if (lowerText.includes(pattern)) {
          if (translations[key]) {
            node.nodeValue = node.nodeValue.replace(
              new RegExp(pattern, 'i'),
              translations[key]
            );
          }
          break;
        }
      }
    }
  });
}

function walkText(node, callback) {
  if (node.nodeType === 3) { // Text node
    callback(node);
  } else {
    for (let i = 0; i < node.childNodes.length; i++) {
      walkText(node.childNodes[i], callback);
    }
  }
}

// Инициализируем автоматический переводчик
setupAutoTranslator();
