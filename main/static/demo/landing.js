// Демо «Лендинг»: меню на телефоне и форма заявки.
// Бэкенда нет: заявка никуда не отправляется, после проверки полей показывается сообщение.
(function () {
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
    summary.textContent =
      `${data.get('name').trim()}, мы получили заявку на маршрут ` +
      `${data.get('from').trim()} → ${data.get('to').trim()}. Менеджер позвонит в течение часа.`;
    fields.hidden = true;
    done.hidden = false;
  });

  document.getElementById('formAgain').addEventListener('click', () => {
    form.reset();
    done.hidden = true;
    fields.hidden = false;
  });
})();
