// Демо «Telegram-бот»: бот записи клиентов прямо на странице.
// Сценарий тот же, что у настоящего бота в Telegram (main/bot.py): услуга, мастер,
// день, время, подтверждение. Запись понарошку: ничего никуда не отправляется.
(function () {
  const t = window.demoText; // перевод строки на язык страницы (см. templates/demo/_bar.html)
  const SERVICES = {
    cut: [t('Стрижка'), 5000, t('45 мин')],
    beard: [t('Стрижка и борода'), 7500, t('1 ч 15 мин')],
    color: [t('Окрашивание'), 15000, t('2 ч')],
    nails: [t('Маникюр'), 8000, t('1 ч 30 мин')],
  };
  const MASTERS = { a: t('Айдана'), t: t('Тимур'), any: t('Любой свободный мастер') };
  const SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
  const WEEKDAYS = [t('Вс'), t('Пн'), t('Вт'), t('Ср'), t('Чт'), t('Пт'), t('Сб')];
  const MONTHS = [t('янв'), t('фев'), t('мар'), t('апр'), t('мая'), t('июн'), t('июл'), t('авг'), t('сен'), t('окт'), t('ноя'), t('дек')];
  const DAYS_AHEAD = 6; // на сколько дней вперёд можно записаться
  const MANAGER_CHAT = 'https://t.me/devixco';
  const DEMO_NOTE = t('<i>Это демо: запись никуда не сохраняется.</i>');

  const $ = (id) => document.getElementById(id);
  const money = (amount) => amount.toLocaleString('ru-RU').replace(/\u00a0/g, ' ') + ' ₸';
  const clock = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  // в английском названия месяцев и дней пишутся с заглавной и внутри фразы
  const lower = (text) => (document.documentElement.lang === 'en' ? text : text.toLowerCase());
  const escape = (text) => text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  // ---------- дни и свободное время ----------

  function dayLabel(offset) {
    const day = new Date();
    day.setDate(day.getDate() + offset);
    const prefix = offset === 0 ? t('Сегодня') : offset === 1 ? t('Завтра') : WEEKDAYS[day.getDay()];
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
  const orderKey = { text: t('🚀 Хочу такого же бота'), url: MANAGER_CHAT };

  const screens = {
    menu: (greeting) => ({
      text: greeting
        ? t('👋 Здравствуйте! Это <b>демо-бот записи клиентов</b> от DevIX.\n\nТак может выглядеть запись в ваш салон, клинику или автосервис: клиент сам выбирает услугу, мастера и время — без звонков и ожидания.\n\nПопробуйте записаться 👇')
        : t('Выберите действие 👇'),
      keys: [
        [key(t('✂️ Записаться'), () => screens.services())],
        [key(t('💰 Услуги и цены'), () => screens.price()), key(t('📍 Адрес'), () => screens.address())],
        [orderKey],
      ],
    }),

    services: () => ({
      text: t('<b>Шаг 1 из 4.</b> Выберите услугу:'),
      keys: [
        ...Object.entries(SERVICES).map(([code, [name, price]]) => [key(`${name} · ${money(price)}`, () => screens.masters({ service: code }))]),
        [key(t('‹ В меню'), () => screens.menu())],
      ],
    }),

    masters: (b) => ({
      text: `<b>${t('Шаг 2 из 4.')}</b> ${SERVICES[b.service][0]}${t('\n\nК какому мастеру вас записать?')}`,
      keys: [
        ...Object.entries(MASTERS).map(([code, name]) => [key(name, () => screens.days({ ...b, master: code }))]),
        [key(t('‹ Назад'), () => screens.services())],
      ],
    }),

    days: (b) => {
      const days = [...Array(DAYS_AHEAD + 1).keys()].filter((offset) => freeSlots(offset, b.master).length);
      const who = b.master === 'any' ? t('любой свободный мастер') : `${t('мастер')} ${MASTERS[b.master]}`;
      return {
        text: `<b>${t('Шаг 3 из 4.')}</b> ${SERVICES[b.service][0]}, ${who}${t('\n\nВыберите день:')}`,
        keys: [...rows(days.map((offset) => key(dayLabel(offset), () => screens.times({ ...b, day: offset }))), 2), [key(t('‹ Назад'), () => screens.masters(b))]],
      };
    },

    times: (b) => ({
      text: `<b>${t('Шаг 4 из 4.')}</b> ${SERVICES[b.service][0]}${t('\n\nСвободное время на')} <b>${lower(dayLabel(b.day))}</b>:`,
      keys: [...rows(freeSlots(b.day, b.master).map((slot) => key(slot, () => screens.confirm({ ...b, slot }))), 4), [key(t('‹ Назад'), () => screens.days(b))]],
    }),

    confirm: (b) => ({
      text: `${t('Проверьте запись:\n\n')}${summary(b)}${t('\n\nВсё верно?')}`,
      keys: [
        [key(t('✅ Подтвердить'), () => screens.done(b))],
        [key(t('✏️ Изменить'), () => screens.services()), key(t('‹ Назад'), () => screens.times(b))],
      ],
    }),

    done: (b) => ({
      text: `✅ <b>${t('Вы записаны!')}</b>\n\n${summary(b)}${t('\n\n📍 Астана, пр. Примерный, 1\n🔔 За 2 часа до визита пришлю напоминание.\n\n')}${DEMO_NOTE}`,
      keys: [
        [key(t('🔁 Перенести'), () => screens.days(b)), key(t('❌ Отменить'), () => screens.cancelled(b))],
        [key(t('🏠 В меню'), () => screens.menu())],
        [orderKey],
      ],
    }),

    cancelled: (b) => ({
      text: `❌ <b>${t('Запись отменена')}</b>\n\n<s>${SERVICES[b.service][0]}, ${lower(dayLabel(b.day))}, ${b.slot}</s>${t('\n\nЕсли планы изменятся — запишитесь снова.')}`,
      keys: [[key(t('✂️ Записаться снова'), () => screens.services())], [key(t('🏠 В меню'), () => screens.menu())]],
    }),

    price: () => ({
      text: t('💰 <b>Услуги и цены</b>\n\n') + Object.values(SERVICES).map(([name, price, duration]) => `• ${name} — <b>${money(price)}</b>, ${duration}`).join('\n'),
      keys: [[key(t('✂️ Записаться'), () => screens.services())], [key(t('‹ В меню'), () => screens.menu())]],
    }),

    address: () => ({
      text: t('📍 <b>Адрес и контакты</b>\n\nАстана, пр. Примерный, 1\nЕжедневно с 10:00 до 20:00\n+7 700 000 00 00\n\n<i>Адрес и телефон вымышленные.</i>'),
      keys: [[key(t('✂️ Записаться'), () => screens.services())], [key(t('‹ В меню'), () => screens.menu())]],
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
    status.textContent = t('печатает…');
    status.classList.add('is-typing');
    setTimeout(() => {
      status.textContent = t('бот');
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
