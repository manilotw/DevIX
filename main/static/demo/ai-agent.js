// Демо «AI-агент»: пример диалога покупателя с агентом магазина.
// Писать в чат нельзя: сообщения заготовлены и появляются по одному, пока посетитель
// листает страницу вниз. Настоящей модели и бэкенда здесь нет.
(function () {
  const t = window.demoText; // перевод строки на язык страницы (см. templates/demo/_bar.html)
  // картинки лежат в static/img/demo/ai
  const IMG = '/static/img/demo/ai/';
  const PODS = `<img src="${IMG}pods.jpg" alt="">`;
  const product = (name, price, note) =>
    `<div class="item">${PODS}<div><b>${name}</b><span>${note}</span><em>${price}</em></div></div>`;

  const MESSAGES = [
    { from: 'user', html: t('<p>Здравствуйте!</p>') },
    { from: 'agent', html: t('<p>Здравствуйте! Я AI-ассистент магазина. Помогу выбрать товар, расскажу о наличии и доставке и оформлю заказ. Что вас интересует?</p>') },
    { from: 'user', html: t('<p>Ищу беспроводные наушники для работы и перелётов. Бюджет — до 90 000 ₸.</p>') },
    {
      from: 'agent',
      html: t('<p>В этот бюджет подходят две модели, обе есть в наличии:</p>') +
        `<div class="cards">${product('Air Pro', '79 990 ₸', t('Шумоподавление, 30 часов'))}${product('Air Lite', '49 990 ₸', t('Без шумоподавления, 24 часа'))}</div>` +
        t('<p>Для перелётов советую Air Pro: шумоподавление глушит гул самолёта.</p>'),
    },
    { from: 'user', html: t('<p>А чем ещё Pro лучше, кроме шумоподавления?</p>') },
    {
      from: 'agent',
      html: t('<p>Вот главное в сравнении:</p>') +
        '<table class="compare"><tr><th></th><th>Air Pro</th><th>Air Lite</th></tr>' +
        t('<tr><td>Без подзарядки</td><td>30 часов</td><td>24 часа</td></tr>') +
        t('<tr><td>Быстрая зарядка</td><td>10 минут = 5 часов</td><td>нет</td></tr>') +
        t('<tr><td>Подключение</td><td>2 устройства сразу</td><td>1 устройство</td></tr>') +
        t('<tr><td>Микрофоны</td><td>6, с подавлением шума</td><td>2</td></tr></table>') +
        t('<p>Если часто летаете и много созваниваетесь, разница в цене себя оправдает.</p>'),
    },
    { from: 'user', html: t('<p>Убедили. Есть в белом цвете? И сколько идёт доставка в Астану?</p>') },
    { from: 'agent', html: t('<p>Белые есть, на складе 4 штуки. Доставка курьером в Астану займёт 1–2 дня, для заказов от 50 000 ₸ она бесплатная.</p><p>Оформить заказ на адрес из вашего профиля?</p>') },
    { from: 'user', html: t('<p>Да, оформляйте.</p>') },
    {
      from: 'agent',
      html: t('<p>Готово, заказ оформлен ✅</p>') +
        `<div class="order">${PODS}<div><b>${t('Air Pro, белые')}</b><span>${t('Заказ № 1249 · курьером в Астану, 1–2 дня')}</span><em>79 990 ₸</em></div>` +
        t('<span class="order__ok"><svg><use href="#a-check"/></svg>Оформлен</span></div>') +
        t('<p>Ссылку на оплату отправил сюда и на вашу почту. Напишу, когда заказ передадут курьеру.</p>'),
    },
  ];

  const STEPS = MESSAGES.length;
  const TYPING = '<div class="typing"><i></i><i></i><i></i></div>';
  const $ = (id) => document.getElementById(id);
  const HINT = $('hintText').innerHTML; // на телефоне хвост подсказки скрыт стилями
  const track = $('track'), feed = $('feed'), msgs = $('msgs'), hint = $('hint');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let step = 300;      // сколько пикселей прокрутки приходится на одно сообщение
  let shown = 0;       // сколько сообщений уже в чате
  let target = 0;      // сколько должно быть при текущей прокрутке
  let busy = false;    // агент «печатает»
  let instant = false; // показать всё сразу, без ожидания

  // Высота дорожки: окно чата + путь прокрутки на все сообщения.
  // Когда диалог показан целиком, дорожка укорачивается, чтобы не листать впустую.
  function layout() {
    const appHeight = document.querySelector('.app').offsetHeight;
    step = Math.max(240, Math.min(380, window.innerHeight * 0.42));
    track.style.height = appHeight + step * (instant ? 0.8 : STEPS + 0.6) + 'px';
  }

  function follow() {
    feed.scrollTo({ top: feed.scrollHeight, behavior: instant || calm ? 'auto' : 'smooth' });
  }

  function update() {
    const done = shown === STEPS;
    $('hintCount').textContent = `${shown} / ${STEPS}`;
    $('hintText').innerHTML = done ? t('Диалог завершён') : HINT;
    $('hintArrow').style.display = done ? 'none' : '';
    $('showAll').hidden = done;
    $('restart').hidden = !done;
    hint.classList.toggle('is-done', done);
    feed.classList.toggle('is-free', done);

    // агент работает с данными магазина: после оформления заказ появляется в сводке
    $('ordersToday').textContent = done ? '25' : '24';
    $('ordersDelta').textContent = done ? '+25%' : '+20%';
    $('ordersToday').closest('.fact').classList.toggle('is-updated', done);
  }

  // Добавляет в чат следующее сообщение, пока их меньше, чем нужно
  function pump() {
    if (busy || shown >= target) return;

    const message = MESSAGES[shown];
    const agent = message.from === 'agent';
    const node = document.createElement('div');
    node.className = `msg msg--${message.from}`;
    node.innerHTML = `<span class="msg__avatar"><img src="${IMG}${agent ? 'robot' : 'user'}.jpg" alt="${agent ? t('Агент') : t('Покупатель')}"></span><div class="bubble"></div>`;
    const bubble = node.lastElementChild;
    msgs.append(node);

    const finish = () => {
      bubble.innerHTML = message.html;
      shown += 1;
      busy = false;
      follow();
      update();
      if (instant) pump();
      else setTimeout(pump, 250);
    };

    if (agent && !instant && !calm) {
      busy = true;
      bubble.innerHTML = TYPING;
      follow();
      // если посетитель пролистал далеко вперёд, агент «печатает» быстрее
      setTimeout(finish, target - shown > 2 ? 250 : 700);
    } else finish();
  }

  function onScroll() {
    if (instant) return;
    const count = Math.max(0, Math.min(STEPS, Math.floor(window.scrollY / step + 0.6)));
    if (count > target) {
      target = count;
      pump();
    }
  }

  function showAll() {
    instant = true;
    target = STEPS;
    if (!busy) pump();
    layout();
  }

  function restart() {
    window.scrollTo(0, 0);
    msgs.innerHTML = '';
    shown = target = 0;
    busy = instant = false;
    feed.scrollTop = 0;
    layout();
    update();
  }

  $('showAll').addEventListener('click', showAll);
  $('restart').addEventListener('click', restart);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', layout);

  layout();
  update();
  if (location.hash === '#all') showAll();
  else onScroll();
})();
