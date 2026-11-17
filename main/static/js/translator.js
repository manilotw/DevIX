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

const TRANSLATIONS_VERSION = '20261117h';
let currentLang = getCurrentLang();
let translations = {};

// Загружаем переводы сразу при загрузке скрипта
function initTranslator() {
  // Сервер уже отдал страницу на языке адреса: переводы нужны, только если
  // посетитель раньше выбрал другой язык
  if (window.pageLang !== currentLang) {
    loadTranslations(currentLang);
  }
  
  // Обновляем кнопки языков когда DOM готов
  window.addEventListener('DOMContentLoaded', function() {
    updateLangButtons();
    updateAllLinks();
  });
}

function loadTranslations(lang) {
  fetch(`/static/js/${lang}.json?v=${TRANSLATIONS_VERSION}`)
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
  currentPath = currentPath.replace(/^\/(ru|en)(?=\/|$)/, ''); // Убираем /ru или /en
  
  // Если путь пустой, ставим /
  if (!currentPath) {
    currentPath = '/';
  }
  
  // Переходим на новый язык: русская версия - без префикса, английская - /en
  window.location.href = lang === 'en' ? '/en' + currentPath : currentPath;
}

function updateAllLinks() {
  // Внутренние ссылки ведут на страницы выбранного языка
  const links = document.querySelectorAll('a[href^="/"]');
  links.forEach(link => {
    const href = link.getAttribute('href');

    // Пропускаем API, статику и админку
    if (/^\/(api|static|admin)(\/|$)/.test(href)) {
      return;
    }

    const path = href.replace(/^\/(ru|en)(?=\/|$)/, '') || '/';
    link.setAttribute('href', currentLang === 'en' ? '/en' + path : path);
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

  // Переводим подписи картинок
  document.querySelectorAll('[data-i18n-alt]').forEach(element => {
    const key = element.getAttribute('data-i18n-alt');
    if (t[key]) {
      element.alt = t[key];
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

