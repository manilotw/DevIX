// Загрузка header и footer из base.html
function loadHeaderFooter() {
  fetch('base.html')
    .then(response => response.text())
    .then(html => {
      // Парсим загруженный HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Извлекаем header и footer
      const header = doc.querySelector('header');
      const footer = doc.querySelector('footer');
      
      // Вставляем header в контейнер
      const headerContainer = document.getElementById('header-container');
      if (headerContainer && header) {
        headerContainer.appendChild(header);
      }
      
      // Вставляем footer в контейнер
      const footerContainer = document.getElementById('footer-container');
      if (footerContainer && footer) {
        footerContainer.appendChild(footer);
      }
    })
    .catch(error => console.log('Ошибка загрузки header/footer:', error));
}

// Загружаем при загрузке страницы
document.addEventListener('DOMContentLoaded', loadHeaderFooter);
