// Определяем текущий язык: сначала проверяем localStorage, потом URL
function getCurrentLang() {
  // ПРИОРИТЕТ 1: localStorage (сохраненный выбор пользователя)
  const savedLang = localStorage.getItem('lang');
  if (savedLang && (savedLang === 'en' || savedLang === 'ru')) {
    return savedLang;
  }
  
  // ПРИОРИТЕТ 2: URL
  const path = window.location.pathname;
  if (path.startsWith('/en')) {
    return 'en';
  } else if (path.startsWith('/ru')) {
    return 'ru';
  }
  
  // ПРИОРИТЕТ 3: по умолчанию
  return 'ru';
}

let currentLang = getCurrentLang();
let translations = {};

// Загружаем переводы сразу при загрузке скрипта
function initTranslator() {
  loadTranslations(currentLang);
  
  // Обновляем кнопки языков когда DOM готов
  window.addEventListener('DOMContentLoaded', function() {
    updateLangButtons();
    updateAllLinks();
  });
}

function loadTranslations(lang) {
  fetch(`/static/js/${lang}.json`)
    .then(response => {
      if (!response.ok) {
        console.error('Failed to load translations:', response.status);
        return;
      }
      return response.json();
    })
    .then(data => {
      if (data) {
        translations = data;
        applyTranslations();
        updateLangButtons();
      }
    })
    .catch(error => console.error('Error loading translations:', error));
}

function switchLanguage(lang) {
  // Сохраняем выбранный язык в localStorage
  localStorage.setItem('lang', lang);
  
  // Получаем текущий путь без языкового префикса
  let currentPath = window.location.pathname;
  currentPath = currentPath.replace(/^\/(ru|en)/, ''); // Убираем /ru или /en
  
  // Если путь пустой, ставим /
  if (!currentPath) {
    currentPath = '/';
  }
  
  // Переходим на новый язык
  if (lang === 'en') {
    window.location.href = '/en' + currentPath;
  } else if (lang === 'ru') {
    window.location.href = '/ru' + currentPath;
  }
}

function updateAllLinks() {
  // Обновляем все внутренние ссылки, добавляя языковой префикс
  const links = document.querySelectorAll('a[href^="/"]');
  links.forEach(link => {
    let href = link.getAttribute('href');
    
    // Пропускаем API ссылки
    if (href.startsWith('/api/')) {
      return;
    }
    
    // Пропускаем ссылки которые уже имеют языковой префикс
    if (href.startsWith('/ru/') || href.startsWith('/en/')) {
      return;
    }
    
    // Добавляем языковой префикс
    if (currentLang === 'en') {
      if (href === '/') {
        link.setAttribute('href', '/en/');
      } else {
        link.setAttribute('href', '/en' + href);
      }
    } else if (currentLang === 'ru') {
      if (href === '/') {
        link.setAttribute('href', '/ru/');
      } else {
        link.setAttribute('href', '/ru' + href);
      }
    }
  });
}

function applyTranslations() {
  if (!translations || Object.keys(translations).length === 0) {
    return; // Если переводы не загружены, выходим
  }
  
  const t = translations;
  
  // Переводим элементы с data-i18n атрибутом
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (t[key]) {
      element.textContent = t[key];
    }
  });
  
  // Переводим элементы с data-i18n-html для сохранения HTML
  document.querySelectorAll('[data-i18n-html]').forEach(element => {
    const key = element.getAttribute('data-i18n-html');
    if (t[key]) {
      element.innerHTML = t[key];
    }
  });
  
  // Переводим placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (t[key]) {
      element.placeholder = t[key];
    }
  });

  // Переводим значения data-label
  document.querySelectorAll('[data-i18n-label]').forEach(element => {
    const key = element.getAttribute('data-i18n-label');
    if (t[key]) {
      element.setAttribute('data-label', t[key]);
    }
  });
}

function updateLangButtons() {
  const langBtns = document.querySelectorAll('.lang-selector-btn');
  langBtns.forEach(btn => {
    const lang = btn.getAttribute('data-lang');
    if (lang === currentLang) {
      btn.classList.add('lang-btn-active');
    } else {
      btn.classList.remove('lang-btn-active');
    }
  });
}

// Инициализируем переводы при загрузке скрипта
initTranslator();

