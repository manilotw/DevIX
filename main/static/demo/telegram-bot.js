// Демо «Telegram-бот»: бот записи клиентов прямо на странице.
// Сценарий тот же, что у настоящего бота в Telegram (main/bot.py): услуга, мастер,
// день, время, подтверждение. Запись понарошку: ничего никуда не отправляется.
(function () {
  const SERVICES = {
    cut: ['Стрижка', 5000, '45 мин'],
    beard: ['Стрижка и борода', 7500, '1 ч 15 мин'],
    color: ['Окрашивание', 15000, '2 ч'],
    nails: ['Маникюр', 8000, '1 ч 30 мин'],
  };
  const MASTERS = { a: 'Айдана', t: 'Тимур', any: 'Любой свободный мастер' };
  const SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
  const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const DAYS_AHEAD = 6; // на сколько дней вперёд можно записаться
  const MANAGER_CHAT = 'https://t.me/devixco';
  const DEMO_NOTE = '<i>Это демо: запись никуда не сохраняется.</i>';

  const $ = (id) => document.getElementById(id);
  const money = (amount) => amount.toLocaleString('ru-RU').replace(/\u00a0/g, ' ') + ' ₸';
  const clock = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const escape = (text) => text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  // ---------- дни и свободное время ----------

  function dayLabel(offset) {
    const day = new Date();
    day.setDate(day.getDate() + offset);
    const prefix = offset === 0 ? 'Сегодня' : offset === 1 ? 'Завтра' : WEEKDAYS[day.getDay()];
    return `${prefix}, ${day.getDate()} ${MONTHS[day.getMonth()]}`;
  }

  // число из строки: по нему занятость получается «случайной», но постоянной
  function seed(text) {
    let hash = 7;
    for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) % 9973;
    return hash;
  }

  function freeSlots(offset, master) {
    const hour = new Date().getHours();
    return SLOTS.filter((slot) => (offset > 0 || parseInt(slot, 10) > hour) && seed(dayLabel(offset) + master + slot) % 3);
  }

  // для «любого мастера» бот сам выбирает, к кому записать
  const assigned = (b) => (b.master !== 'any' ? MASTERS[b.master] : MASTERS[seed(dayLabel(b.day) + b.slot) % 2 ? 'a' : 't']);

  function summary(b) {
    const [name, price, duration] = SERVICES[b.service];
    return `💈 <b>${name}</b> · ${duration}\n👤 ${assigned(b)}\n🗓 ${dayLabel(b.day)}, ${b.slot}\n💳 ${money(price)}`;
  }

  // ---------- экраны: текст сообщения и ряды кнопок ----------

  const key = (text, go) => ({ text, go });
  const rows = (keys, perRow) => keys.reduce((list, k, i) => (i % perRow ? list[list.length - 1].push(k) : list.push([k]), list), []);
  const orderKey = { text: '🚀 Хочу такого же бота', url: MANAGER_CHAT };

  const screens = {
    menu: (greeting) => ({
      text: greeting
        ? '👋 Здравствуйте! Это <b>демо-бот записи клиентов</b> от DevIX.\n\nТак может выглядеть запись в ваш салон, клинику или автосервис: клиент сам выбирает услугу, мастера и время — без звонков и ожидания.\n\nПопробуйте записаться 👇'
        : 'Выберите действие 👇',
      keys: [
        [key('✂️ Записаться', () => screens.services())],
        [key('💰 Услуги и цены', () => screens.price()), key('📍 Адрес', () => screens.address())],
        [orderKey],
      ],
    }),

    services: () => ({
      text: '<b>Шаг 1 из 4.</b> Выберите услугу:',
      keys: [
        ...Object.entries(SERVICES).map(([code, [name, price]]) => [key(`${name} · ${money(price)}`, () => screens.masters({ service: code }))]),
        [key('‹ В меню', () => screens.menu())],
      ],
    }),

    masters: (b) => ({
      text: `<b>Шаг 2 из 4.</b> ${SERVICES[b.service][0]}\n\nК какому мастеру вас записать?`,
      keys: [
        ...Object.entries(MASTERS).map(([code, name]) => [key(name, () => screens.days({ ...b, master: code }))]),
        [key('‹ Назад', () => screens.services())],
      ],
    }),

    days: (b) => {
      const days = [...Array(DAYS_AHEAD + 1).keys()].filter((offset) => freeSlots(offset, b.master).length);
      const who = b.master === 'any' ? 'любой свободный мастер' : `мастер ${MASTERS[b.master]}`;
      return {
        text: `<b>Шаг 3 из 4.</b> ${SERVICES[b.service][0]}, ${who}\n\nВыберите день:`,
        keys: [...rows(days.map((offset) => key(dayLabel(offset), () => screens.times({ ...b, day: offset }))), 2), [key('‹ Назад', () => screens.masters(b))]],
      };
    },

    times: (b) => ({
      text: `<b>Шаг 4 из 4.</b> ${SERVICES[b.service][0]}\n\nСвободное время на <b>${dayLabel(b.day).toLowerCase()}</b>:`,
      keys: [...rows(freeSlots(b.day, b.master).map((slot) => key(slot, () => screens.confirm({ ...b, slot }))), 4), [key('‹ Назад', () => screens.days(b))]],
    }),

    confirm: (b) => ({
      text: `Проверьте запись:\n\n${summary(b)}\n\nВсё верно?`,
      keys: [
        [key('✅ Подтвердить', () => screens.done(b))],
        [key('✏️ Изменить', () => screens.services()), key('‹ Назад', () => screens.times(b))],
      ],
    }),

    done: (b) => ({
      text: `✅ <b>Вы записаны!</b>\n\n${summary(b)}\n\n📍 Астана, пр. Примерный, 1\n🔔 За 2 часа до визита пришлю напоминание.\n\n${DEMO_NOTE}`,
      keys: [
        [key('🔁 Перенести', () => screens.days(b)), key('❌ Отменить', () => screens.cancelled(b))],
        [key('🏠 В меню', () => screens.menu())],
        [orderKey],
      ],
    }),

    cancelled: (b) => ({
      text: `❌ <b>Запись отменена</b>\n\n<s>${SERVICES[b.service][0]}, ${dayLabel(b.day).toLowerCase()}, ${b.slot}</s>\n\nЕсли планы изменятся — запишитесь снова.`,
      keys: [[key('✂️ Записаться снова', () => screens.services())], [key('🏠 В меню', () => screens.menu())]],
    }),

    price: () => ({
      text: '💰 <b>Услуги и цены</b>\n\n' + Object.values(SERVICES).map(([name, price, duration]) => `• ${name} — <b>${money(price)}</b>, ${duration}`).join('\n'),
      keys: [[key('✂️ Записаться', () => screens.services())], [key('‹ В меню', () => screens.menu())]],
    }),

    address: () => ({
      text: '📍 <b>Адрес и контакты</b>\n\nАстана, пр. Примерный, 1\nЕжедневно с 10:00 до 20:00\n+7 700 000 00 00\n\n<i>Адрес и телефон вымышленные.</i>',
      keys: [[key('✂️ Записаться', () => screens.services())], [key('‹ В меню', () => screens.menu())]],
    }),
  };

  // ---------- чат ----------

  const feed = $('feed');
  const msgs = $('msgs');

  function toBottom() {
    feed.scrollTop = feed.scrollHeight;
  }

  // Рисует экран в сообщении бота. Нажатие кнопки меняет это же сообщение, как в Telegram.
  function draw(node, screen) {
    const bubble = node.querySelector('.bubble');
    bubble.innerHTML = `${screen.text}<time>${clock()}</time>`;
    bubble.classList.remove('is-fresh');
    void bubble.offsetWidth; // чтобы подсветка изменения сыграла заново
    bubble.classList.add('is-fresh');

    const keys = node.querySelector('.keys');
    keys.innerHTML = '';
    screen.keys.forEach((row) => {
      const line = document.createElement('div');
      line.className = 'keys__row';
      row.forEach((k) => {
        const el = document.createElement(k.url ? 'a' : 'button');
        el.className = 'key';
        el.textContent = k.text;
        if (k.url) {
          el.href = k.url;
          el.target = '_blank';
          el.rel = 'noopener';
          el.insertAdjacentHTML('beforeend', '<svg><use href="#t-link"/></svg>');
        } else {
          el.type = 'button';
          el.addEventListener('click', () => {
            draw(node, k.go());
            toBottom();
          });
        }
        line.append(el);
      });
      keys.append(line);
    });

    $('sideLast').textContent = bubble.textContent.split('\n')[0].replace(/\d\d:\d\d$/, '').slice(0, 40);
  }

  function say(text) {
    const node = document.createElement('div');
    node.className = 'msg msg--me';
    node.innerHTML = `<div class="bubble">${escape(text)}<time>${clock()}</time></div>`;
    msgs.append(node);
    toBottom();
  }

  // бот «печатает» и присылает новое сообщение с экраном
  function reply(screen) {
    const status = $('status');
    status.textContent = 'печатает…';
    status.classList.add('is-typing');
    setTimeout(() => {
      status.textContent = 'бот';
      status.classList.remove('is-typing');
      const node = document.createElement('div');
      node.className = 'msg';
      node.innerHTML = '<div class="bubble"></div><div class="keys"></div>';
      msgs.append(node);
      draw(node, screen);
      toBottom();
    }, 500);
  }

  function send(text) {
    $('about').hidden = true;
    say(text);
    reply(screens.menu(text === '/start'));
  }

  $('start').addEventListener('click', () => {
    $('start').hidden = true;
    $('composer').hidden = false;
    send('/start');
  });

  $('menuBtn').addEventListener('click', () => send('/start'));

  $('composer').addEventListener('submit', (event) => {
    event.preventDefault();
    const text = $('input').value.trim();
    if (!text) return;
    $('input').value = '';
    send(text);
  });
})();
