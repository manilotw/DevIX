// Демо «Лендинг»: меню на телефоне и форма заявки.
// Бэкенда нет: заявка никуда не отправляется, после проверки полей показывается сообщение.
(function () {
  const t = window.demoText; // перевод строки на язык страницы (см. templates/demo/_bar.html)
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  }

  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });

  const form = document.getElementById('form');
  const fields = document.getElementById('formFields');
  const done = document.getElementById('formDone');
  const summary = document.getElementById('formSummary');

  form.addEventListener('input', (event) => event.target.classList.remove('is-error'));

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    let firstEmpty = null;
    form.querySelectorAll('[required]').forEach((input) => {
      const empty = !input.value.trim();
      input.classList.toggle('is-error', empty);
      if (empty && !firstEmpty) firstEmpty = input;
    });
    if (firstEmpty) {
      firstEmpty.focus();
      return;
    }

    const data = new FormData(form);
    summary.textContent = t('{name}, мы получили заявку на маршрут {from} → {to}. Менеджер позвонит в течение часа.', {
      name: data.get('name').trim(),
      from: data.get('from').trim(),
      to: data.get('to').trim(),
    });
    fields.hidden = true;
    done.hidden = false;
  });

  document.getElementById('formAgain').addEventListener('click', () => {
    form.reset();
    done.hidden = true;
    fields.hidden = false;
  });
})();
