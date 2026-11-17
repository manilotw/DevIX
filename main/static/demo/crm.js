// Демо «CRM»: регистрация, разделы и примерные данные магазина.
// Бэкенда нет: всё хранится в памяти страницы и пропадает при обновлении.
(function () {
  const $ = (id) => document.getElementById(id);
  const group = (n) => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');
  const money = (n) => '₸ ' + group(n);
  const icon = (id) => `<svg><use href="#${id}"/></svg>`;
  const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- данные ----------

  // фото товаров лежат в static/img/demo
  const IMG = '/static/img/demo/';
  const CATALOG_SIZE = 526; // всего товаров в магазине; в демо показаны самые продаваемые
  const products = [
    { id: 1, name: 'Наушники беспроводные', cat: 'Электроника', price: 24900, stock: 42, min: 10, sold: 318, on: true, img: 'crm/headphones' },
    { id: 2, name: 'Кроссовки беговые', cat: 'Обувь', price: 38000, stock: 18, min: 8, sold: 204, on: true, img: 'crm/sneakers' },
    { id: 3, name: 'Рюкзак City', cat: 'Аксессуары', price: 17500, stock: 3, min: 6, sold: 187, on: true, img: 'crm/backpack' },
    { id: 4, name: 'Смарт-часы', cat: 'Электроника', price: 59900, stock: 11, min: 5, sold: 96, on: true, img: 'shop/watch' },
    { id: 5, name: 'Свитер оверсайз', cat: 'Одежда', price: 31900, stock: 0, min: 4, sold: 73, on: false, img: 'shop/cat-clothes' },
    { id: 6, name: 'Сумка Classic', cat: 'Аксессуары', price: 21000, stock: 25, min: 6, sold: 141, on: true, img: 'shop/cat-bag' },
    { id: 7, name: 'Очки солнцезащитные', cat: 'Аксессуары', price: 12900, stock: 130, min: 30, sold: 412, on: true, img: 'shop/sunglasses' },
    { id: 8, name: 'Аромадиффузор', cat: 'Для дома', price: 8500, stock: 7, min: 10, sold: 158, on: true, img: 'shop/diffuser' },
  ];
  const thumb = (product) => `<span class="thumb"><img src="${IMG}${product.img}.jpg" alt=""></span>`;

  const clients = [
    { name: 'Айбек С.', phone: '+7 700 111 20 31', orders: 14, total: 412300 },
    { name: 'Меруерт Т.', phone: '+7 700 112 45 08', orders: 9, total: 286500 },
    { name: 'Нурсултан А.', phone: '+7 700 113 77 12', orders: 3, total: 61400 },
    { name: 'Алия К.', phone: '+7 700 114 02 96', orders: 21, total: 734900 },
    { name: 'Данияр М.', phone: '+7 700 115 63 40', orders: 6, total: 158200 },
    { name: 'Жанна Б.', phone: '+7 700 116 18 75', orders: 1, total: 24900 },
    { name: 'Ерлан Т.', phone: '+7 700 117 90 22', orders: 11, total: 359000 },
    { name: 'Сауле Н.', phone: '+7 700 118 34 59', orders: 4, total: 97800 },
    { name: 'Тимур И.', phone: '+7 700 119 56 03', orders: 2, total: 44400 },
    { name: 'Асель Д.', phone: '+7 700 120 71 84', orders: 8, total: 233100 },
    { name: 'Руслан Г.', phone: '+7 700 121 05 67', orders: 5, total: 121500 },
    { name: 'Динара О.', phone: '+7 700 122 48 19', orders: 17, total: 521700 },
  ];

  const STATUSES = { 'Новый': 'grey', 'В обработке': 'blue', 'Оплачен': 'green', 'Доставлен': 'violet', 'Отменён': 'red' };

  // последние заказы: от нового к старому
  const orders = (function () {
    const status = [2, 1, 0, 2, 3, 1, 0, 2, 3, 0, 3, 3, 4, 2, 3, 3, 2, 3];
    const product = [0, 1, 2, 3, 6, 5, 0, 7, 1, 6, 3, 5, 4, 0, 6, 2, 1, 7];
    const minutesAgo = [20, 105, 154, 300, 420, 600, 1500, 1620, 1800, 2900, 3100, 3300, 4400, 4600, 5800, 6000, 7300, 7500];
    const channels = ['Сайт', 'Сайт', 'Kaspi', 'Сайт', 'Instagram', 'Сайт', 'Kaspi', 'Сайт'];
    const names = Object.keys(STATUSES);
    return status.map((s, i) => ({
      id: 1248 - i,
      client: clients[i % clients.length].name,
      product: products[product[i]],
      status: names[s],
      channel: channels[i % channels.length],
      date: new Date(Date.now() - minutesAgo[i] * 60000),
    }));
  })();

  // Выручка и число заказов по дням за полгода: по ним считаются показатели и графики.
  // LEVELS задаёт рост: [сколько дней назад, доля от сегодняшней выручки]; между точками - по прямой.
  const DAYS = 180;
  const LEVELS = [[0, 1.08], [15, 1], [30, 0.92], [45, 0.81], [60, 0.8], [75, 0.79], [90, 0.76], [135, 0.7], [180, 0.64]];

  function level(ago) {
    for (let k = 1; k < LEVELS.length; k++) {
      const [from, a] = LEVELS[k - 1];
      const [to, b] = LEVELS[k];
      if (ago <= to) return a + ((b - a) * (ago - from)) / (to - from);
    }
    return LEVELS[LEVELS.length - 1][1];
  }

  const series = Array.from({ length: DAYS }, (_, i) => {
    const ago = DAYS - 1 - i;
    const revenue = 617700 * level(ago) * (1 + 0.07 * Math.sin(i / 3.1) + 0.05 * Math.sin(i / 1.3 + 1));
    const check = 14768 * Math.pow(1.0536, (15 - ago) / 30); // средний чек понемногу растёт
    return { revenue, orders: revenue / check, date: new Date(Date.now() - ago * 86400000) };
  });

  const campaigns = [
    { name: 'Осенняя распродажа', channel: 'Instagram', on: true, budget: 150000, clicks: 8420, orders: 214 },
    { name: 'Возврат к корзине', channel: 'Сайт', on: true, budget: 60000, clicks: 2310, orders: 96 },
    { name: 'Скидки выходного дня', channel: 'Kaspi', on: true, budget: 200000, clicks: 12900, orders: 342 },
    { name: 'Письмо постоянным клиентам', channel: 'Email', on: false, budget: 15000, clicks: 1240, orders: 58 },
  ];

  const integrations = [
    { name: 'Kaspi Магазин', desc: 'Заказы и остатки синхронизируются автоматически', on: true },
    { name: 'Instagram', desc: 'Заявки из директа попадают в заказы', on: true },
    { name: 'Telegram-бот', desc: 'Новые заказы приходят менеджеру в чат', on: true },
    { name: 'WhatsApp', desc: 'Клиент получает сообщения о статусе заказа', on: false },
    { name: '1С', desc: 'Обмен товарами, остатками и документами', on: false },
    { name: 'Email-рассылки', desc: 'Письма о брошенной корзине и акциях', on: false },
  ];

  const tasks = [
    { text: 'Отправить заказы', done: true },
    { text: 'Пополнить склад', done: false },
    { text: 'Запустить акцию', done: false },
  ];

  const settings = [
    { name: 'Уведомления о новых заказах', desc: 'На почту и в Telegram', on: true },
    { name: 'Еженедельный отчёт', desc: 'Каждый понедельник в 9:00', on: true },
    { name: 'Напоминания об остатках', desc: 'Когда товара меньше минимума', on: false },
  ];

  const state = {
    view: 'overview',
    period: 30,
    filter: 'all',
    query: '',
    user: { name: 'Айгерим', email: 'demo@shopcrm.example', shop: 'Мой магазин' },
  };

  // ---------- расчёты ----------

  function totals(days, offset) {
    const end = DAYS - (offset || 0);
    const part = series.slice(end - days, end);
    return {
      revenue: part.reduce((sum, day) => sum + day.revenue, 0),
      orders: part.reduce((sum, day) => sum + day.orders, 0),
    };
  }

  function deltaHtml(now, before) {
    const percent = Math.round(((now - before) / before) * 100);
    const down = percent < 0;
    return `<span class="delta${down ? ' delta--down' : ''}">${icon('c-up')}${down ? '−' : '+'}${Math.abs(percent)}%</span>`;
  }

  const shortDate = (date) => date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '');

  function orderDate(date) {
    const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86400000);
    return (days === 0 ? 'Сегодня' : days === 1 ? 'Вчера' : shortDate(date)) + ', ' + time;
  }

  // точки графика: при длинном периоде дни объединяются в группы
  function points(days, max) {
    const part = series.slice(DAYS - days);
    const size = Math.ceil(days / max);
    const result = [];
    for (let i = 0; i < part.length; i += size) {
      const chunk = part.slice(i, i + size);
      result.push({ value: chunk.reduce((sum, day) => sum + day.revenue, 0), date: chunk[chunk.length - 1].date });
    }
    return result;
  }

  const shortMoney = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1).replace('.0', '').replace('.', ',') + ' млн' : Math.round(n / 1000) + ' тыс');

  function chartSvg(data, bars) {
    const W = 800, H = 280, left = 62, right = 12, top = 12, bottom = 30;
    const peak = Math.max(...data.map((p) => p.value)) * 1.12;
    const step = (W - left - right) / (bars ? data.length : data.length - 1);
    const x = (i) => left + step * (bars ? i + 0.5 : i);
    const y = (value) => top + (H - top - bottom) * (1 - value / peak);

    let grid = '';
    for (let i = 0; i <= 4; i++) {
      const value = (peak / 4) * i;
      grid += `<line x1="${left}" x2="${W - right}" y1="${y(value)}" y2="${y(value)}" stroke="#ebe8f4"/>` +
        `<text x="${left - 10}" y="${y(value) + 4}" text-anchor="end">${i ? shortMoney(value) : '0'}</text>`;
    }

    const every = Math.ceil(data.length / 7);
    let labels = '';
    data.forEach((p, i) => {
      if ((data.length - 1 - i) % every === 0) labels += `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${shortDate(p.date)}</text>`;
    });

    let body;
    if (bars) {
      const width = Math.min(46, step * 0.62);
      body = data.map((p, i) =>
        `<rect class="bar" x="${x(i) - width / 2}" y="${y(p.value)}" width="${width}" height="${H - bottom - y(p.value)}" rx="6"><title>${shortDate(p.date)}: ${money(p.value)}</title></rect>`
      ).join('');
    } else {
      // сглаженная линия через точки
      let line = `M${x(0)} ${y(data[0].value)}`;
      for (let i = 1; i < data.length; i++) {
        const mid = (x(i - 1) + x(i)) / 2;
        line += ` C${mid} ${y(data[i - 1].value)} ${mid} ${y(data[i].value)} ${x(i)} ${y(data[i].value)}`;
      }
      const last = data.length - 1;
      body = `<path d="${line} L${x(last)} ${H - bottom} L${x(0)} ${H - bottom}Z" fill="url(#area)"/>` +
        `<path d="${line}" fill="none" stroke="#6d4aff" stroke-width="3" stroke-linecap="round"/>` +
        `<circle cx="${x(last)}" cy="${y(data[last].value)}" r="6" fill="#6d4aff" stroke="#fff" stroke-width="3"/>`;
    }

    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="График выручки">
      <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d4aff" stop-opacity=".22"/><stop offset="1" stop-color="#6d4aff" stop-opacity="0"/></linearGradient></defs>
      ${grid}${labels}${body}</svg>`;
  }

  function donutSvg(parts, total) {
    const r = 56, length = 2 * Math.PI * r;
    let offset = 0;
    const rings = parts.map((part) => {
      const dash = (part.share / 100) * length;
      const ring = `<circle cx="80" cy="80" r="${r}" fill="none" stroke="${part.color}" stroke-width="22" stroke-dasharray="${dash} ${length - dash}" stroke-dashoffset="${-offset}"/>`;
      offset += dash;
      return ring;
    }).join('');
    return `<svg viewBox="0 0 160 160"><g transform="rotate(-90 80 80)">${rings}</g>
      <text x="80" y="80" font-size="22" font-weight="700" fill="#1c1830">${group(total)}</text>
      <text x="80" y="98" font-size="12" fill="#6f6b85">заказов</text></svg>`;
  }

  // ---------- разделы ----------

  const CHANNELS = [
    { name: 'Сайт', share: 64, color: '#6d4aff' },
    { name: 'Kaspi', share: 24, color: '#a993ff' },
    { name: 'Instagram', share: 12, color: '#d9d0ff' },
  ];

  function orderRows(list, withChannel) {
    return list.map((order) => `<tr>
      <td data-th="Заказ">#${order.id}</td>
      <td data-th="Товар">${thumb(order.product)}${esc(order.product.name)}</td>
      <td data-th="Клиент">${esc(order.client)}</td>
      <td data-th="Сумма">${money(order.product.price)}</td>
      ${withChannel ? `<td class="dim" data-th="Канал">${order.channel}</td>` : ''}
      <td data-th="Статус">${withChannel
        ? `<select class="badge badge--${STATUSES[order.status]}" data-status="${order.id}" aria-label="Статус">${Object.keys(STATUSES).map((s) => `<option${s === order.status ? ' selected' : ''}>${s}</option>`).join('')}</select>`
        : `<span class="badge badge--${STATUSES[order.status]}">${order.status}</span>`}</td>
      <td class="dim num" data-th="Дата">${orderDate(order.date)}</td>
    </tr>`).join('');
  }

  const views = {
    overview() {
      const now = totals(state.period);
      const before = totals(state.period, state.period);
      const hour = new Date().getHours();
      const hello = hour < 6 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';
      setTitle(`${hello}, ${state.user.name}! 👋`, 'Вот что происходит с вашим магазином сегодня');

      const stat = (ico, label, value, delta) =>
        `<div class="stat"><span class="stat__icon">${icon(ico)}</span><div><span>${label}</span><b>${value}</b>${delta}</div></div>`;

      return `<div class="stats">
          ${stat('c-cart', 'Заказы', group(now.orders), deltaHtml(now.orders, before.orders))}
          ${stat('c-wallet', 'Выручка', money(now.revenue), deltaHtml(now.revenue, before.revenue))}
          ${stat('c-users', 'Клиенты', group(now.orders * 0.715), deltaHtml(now.orders * 0.715, before.orders * 0.735))}
          ${stat('c-box', 'Товары', group(CATALOG_SIZE), '')}
        </div>
        <div class="cols">
          <div class="stack">
            <section class="panel">
              <h2>Выручка</h2>
              <div class="big">${money(now.revenue)} ${deltaHtml(now.revenue, before.revenue)}</div>
              ${chartSvg(points(state.period, 30))}
            </section>
            <section class="panel">
              <div class="panel__head"><h2>Последние заказы</h2><button type="button" class="link" data-view="orders">Все заказы ${icon('c-arrow')}</button></div>
              <div class="table-wrap"><table><tbody>${orderRows(orders.slice(0, 5))}</tbody></table></div>
            </section>
          </div>
          <div class="stack">
            <section class="panel">
              <div class="panel__head"><h2>Каналы продаж</h2></div>
              <div class="donut">${donutSvg(CHANNELS, now.orders)}
                <ul class="legend">${CHANNELS.map((c) => `<li><i style="background:${c.color}"></i>${c.name}<b>${c.share}%</b></li>`).join('')}</ul>
              </div>
            </section>
            <section class="panel">
              <div class="panel__head"><h2>Задачи</h2></div>
              <div class="tasks">${tasks.map((task, i) => `<label class="task"><input type="checkbox" data-task="${i}"${task.done ? ' checked' : ''}><i>${icon('c-check')}</i><span>${esc(task.text)}</span></label>`).join('')}</div>
              <form class="task-add" data-form="task"><input type="text" name="text" placeholder="Новая задача" aria-label="Новая задача"><button type="submit" class="btn btn--soft" aria-label="Добавить">${icon('c-plus')}</button></form>
            </section>
          </div>
        </div>`;
    },

    orders() {
      const fresh = orders.filter((o) => o.status === 'Новый').length;
      setTitle('Заказы', `Последние ${orders.length}, из них новых: ${fresh}`);
      const tab = (key, label, count) => `<button type="button" class="tab${state.filter === key ? ' is-active' : ''}" data-filter="${key}">${label}<b>${count}</b></button>`;
      const list = orders.filter((o) => (state.filter === 'all' || o.status === state.filter) && matches(o.client + ' #' + o.id + ' ' + o.product.name));

      return `<div class="tools">
          <div class="tabs">${tab('all', 'Все', orders.length)}${Object.keys(STATUSES).map((s) => tab(s, s, orders.filter((o) => o.status === s).length)).join('')}</div>
          ${findHtml('Клиент, товар или номер')}
          <button type="button" class="btn btn--primary" data-new-order>${icon('c-plus')}Новый заказ</button>
        </div>
        <section class="panel">${list.length
          ? `<div class="table-wrap"><table><thead><tr><th>№</th><th>Товар</th><th>Клиент</th><th>Сумма</th><th>Канал</th><th>Статус</th><th class="num">Дата</th></tr></thead><tbody>${orderRows(list, true)}</tbody></table></div>`
          : '<p class="none">Заказов не нашлось</p>'}</section>`;
    },

    clients() {
      setTitle('Клиенты', `В базе: ${clients.length}`);
      const segment = (c) => (c.orders >= 10 ? ['VIP', 'violet'] : c.orders >= 4 ? ['Постоянный', 'green'] : ['Новый', 'grey']);
      const list = clients.filter((c) => matches(c.name + ' ' + c.phone));

      return `<div class="tools">${findHtml('Имя или телефон')}</div>
        <section class="panel">${list.length
          ? `<div class="table-wrap"><table><thead><tr><th>Клиент</th><th>Телефон</th><th>Сегмент</th><th class="num">Заказов</th><th class="num">Сумма покупок</th></tr></thead><tbody>${list.map((c) => {
            const [label, color] = segment(c);
            return `<tr><td data-th="Клиент"><span class="thumb">${esc(c.name[0])}</span>${esc(c.name)}</td><td class="dim" data-th="Телефон">${c.phone}</td><td data-th="Сегмент"><span class="badge badge--${color}">${label}</span></td><td class="num" data-th="Заказов">${c.orders}</td><td class="num" data-th="Сумма покупок">${money(c.total)}</td></tr>`;
          }).join('')}</tbody></table></div>`
          : '<p class="none">Клиентов не нашлось</p>'}</section>`;
    },

    products() {
      setTitle('Товары', `В каталоге: ${CATALOG_SIZE}. Показаны самые продаваемые`);
      const list = products.filter((p) => matches(p.name + ' ' + p.cat));

      return `<div class="tools">${findHtml('Название или категория')}</div>
        ${list.length ? `<div class="tiles">${list.map((p) => `<article class="tile">
          <div class="tile__head">${thumb(p)}<div><b>${p.name}</b><span>${p.cat}</span></div>
            <label class="switch" title="В продаже"><input type="checkbox" data-toggle="products" data-id="${p.id}"${p.on ? ' checked' : ''}><i></i></label></div>
          <div class="facts"><div><span>Цена</span><b>${money(p.price)}</b></div><div><span>Остаток</span><b>${p.stock} шт.</b></div><div><span>Продано</span><b>${p.sold}</b></div></div>
        </article>`).join('')}</div>` : '<section class="panel"><p class="none">Товаров не нашлось</p></section>'}`;
    },

    stock() {
      const low = products.filter((p) => p.stock < p.min).length;
      setTitle('Склад', low ? `Нужно пополнить позиций: ${low}` : 'Все товары в наличии');

      return `<section class="panel"><div class="table-wrap"><table>
        <thead><tr><th>Товар</th><th>Остаток</th><th>Минимум</th><th>Статус</th><th></th></tr></thead>
        <tbody>${products.map((p) => {
          const [label, color] = p.stock === 0 ? ['Нет в наличии', 'red'] : p.stock < p.min ? ['Мало', 'amber'] : ['В наличии', 'green'];
          const fill = Math.min(100, (p.stock / (p.min * 3)) * 100);
          return `<tr><td data-th="Товар">${thumb(p)}${p.name}</td>
            <td data-th="Остаток"><span class="meter meter--${color}"><i style="width:${fill}%"></i></span>${p.stock} шт.</td>
            <td class="dim" data-th="Минимум">${p.min} шт.</td><td data-th="Статус"><span class="badge badge--${color}">${label}</span></td>
            <td class="num"><button type="button" class="btn btn--soft btn--sm" data-restock="${p.id}">+10 шт.</button></td></tr>`;
        }).join('')}</tbody></table></div></section>`;
    },

    analytics() {
      const now = totals(state.period);
      setTitle('Аналитика', `Выручка за период: ${money(now.revenue)}`);
      const stat = (label, value) => `<div class="stat"><div><span>${label}</span><b>${value}</b></div></div>`;
      const best = [...products].sort((a, b) => b.sold - a.sold).slice(0, 5);

      return `<div class="stats">
          ${stat('Средний чек', money(now.revenue / now.orders))}${stat('Конверсия в заказ', '3,8%')}${stat('Повторные покупки', '41%')}${stat('Возвраты', '1,2%')}
        </div>
        <div class="cols">
          <section class="panel"><h2>Выручка по периодам</h2>${chartSvg(points(state.period, 13), true)}</section>
          <section class="panel"><div class="panel__head"><h2>Лучшие товары</h2></div>
            <ul class="rank">${best.map((p) => `<li><span>${p.name}</span><b>${p.sold} шт.</b><span class="meter"><i style="width:${(p.sold / best[0].sold) * 100}%"></i></span></li>`).join('')}</ul>
          </section>
        </div>`;
    },

    marketing() {
      setTitle('Маркетинг', `Активных кампаний: ${campaigns.filter((c) => c.on).length}`);
      return `<div class="tiles">${campaigns.map((c, i) => `<article class="tile">
        <div class="tile__head"><span class="thumb">${icon('c-horn')}</span><div><b>${c.name}</b><span>${c.channel}</span></div>
          <label class="switch" title="Кампания активна"><input type="checkbox" data-toggle="campaigns" data-id="${i}"${c.on ? ' checked' : ''}><i></i></label></div>
        <p><span class="badge badge--${c.on ? 'green' : 'grey'}">${c.on ? 'Активна' : 'На паузе'}</span></p>
        <div class="facts"><div><span>Бюджет</span><b>${money(c.budget)}</b></div><div><span>Клики</span><b>${group(c.clicks)}</b></div><div><span>Заказы</span><b>${c.orders}</b></div></div>
      </article>`).join('')}</div>`;
    },

    integrations() {
      setTitle('Интеграции', `Подключено: ${integrations.filter((x) => x.on).length} из ${integrations.length}`);
      return `<div class="tiles">${integrations.map((x, i) => `<article class="tile">
        <div class="tile__head"><span class="thumb">${esc(x.name[0])}</span><div><b>${x.name}</b><span>${x.on ? 'Подключено' : 'Не подключено'}</span></div>
          <label class="switch" title="Подключить"><input type="checkbox" data-toggle="integrations" data-id="${i}"${x.on ? ' checked' : ''}><i></i></label></div>
        <p>${x.desc}</p>
      </article>`).join('')}</div>`;
    },

    settings() {
      setTitle('Настройки', 'Профиль и уведомления');
      return `<div class="settings">
        <section class="panel"><div class="panel__head"><h2>Профиль</h2></div>
          <form class="form" data-form="profile" novalidate>
            <label>Имя<input type="text" name="name" value="${esc(state.user.name)}" required></label>
            <label>Email<input type="email" name="email" value="${esc(state.user.email)}"></label>
            <label>Название магазина<input type="text" name="shop" value="${esc(state.user.shop)}"></label>
            <button type="submit" class="btn btn--primary">Сохранить</button>
          </form>
        </section>
        <section class="panel"><div class="panel__head"><h2>Уведомления</h2></div>
          ${settings.map((s, i) => `<div class="row"><div>${s.name}<span>${s.desc}</span></div><label class="switch"><input type="checkbox" data-toggle="settings" data-id="${i}"${s.on ? ' checked' : ''}><i></i></label></div>`).join('')}
          <div class="row"><div>Аккаунт<span>${esc(state.user.email)}</span></div><button type="button" class="btn btn--soft btn--sm" data-logout>Выйти</button></div>
        </section>
      </div>`;
    },
  };

  const matches = (text) => text.toLowerCase().includes(state.query.trim().toLowerCase());
  const findHtml = (placeholder) =>
    `<label class="find">${icon('c-search')}<input type="search" id="find" placeholder="${placeholder}" value="${esc(state.query)}" aria-label="Поиск"></label>`;

  function setTitle(title, subtitle) {
    $('title').textContent = title;
    $('subtitle').textContent = subtitle;
  }

  // ---------- отрисовка ----------

  function render(keepFocus) {
    $('view').innerHTML = views[state.view]();
    $('avatar').textContent = state.user.name[0].toUpperCase();
    $('newOrders').textContent = orders.filter((o) => o.status === 'Новый').length || '';
    document.querySelectorAll('#menu button').forEach((b) => b.classList.toggle('is-active', b.dataset.view === state.view));

    if (keepFocus) {
      const find = $('find');
      find.focus();
      find.setSelectionRange(find.value.length, find.value.length);
    }
  }

  function go(view) {
    state.view = view;
    state.query = '';
    state.filter = 'all';
    closeSide();
    render();
    window.scrollTo(0, 0);
  }

  let toastTimer;
  function toast(text) {
    $('toast').textContent = text;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ($('toast').hidden = true), 2200);
  }

  function closeSide() {
    $('side').classList.remove('is-open');
    $('shade').hidden = true;
  }

  // проверка обязательных полей формы: подсвечивает пустые и ставит курсор в первое
  function valid(form) {
    let firstEmpty = null;
    form.querySelectorAll('[required]').forEach((input) => {
      const empty = !input.value.trim();
      input.classList.toggle('is-error', empty);
      if (empty && !firstEmpty) firstEmpty = input;
    });
    if (firstEmpty) firstEmpty.focus();
    return !firstEmpty;
  }

  // ---------- вход ----------

  function enter(name, email) {
    if (name) state.user.name = name;
    if (email) state.user.email = email;
    $('auth').hidden = true;
    $('app').hidden = false;
    go('overview');
  }

  $('authForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.target;
    if (!valid(form)) return;
    enter(form.elements.name.value.trim(), form.elements.email.value.trim());
    form.reset();
    toast('Аккаунт создан. Добро пожаловать!');
  });
  $('authForm').addEventListener('input', (event) => event.target.classList.remove('is-error'));
  $('authSkip').addEventListener('click', () => enter());
  // Ссылка вида /demo/crm/#enter открывает кабинет сразу, без экрана регистрации.
  // Метка не должна совпадать с id элемента: иначе браузер прокрутит страницу к нему
  // и верх кабинета уйдёт под полосу DevIX.
  if (location.hash === '#enter') enter();

  // ---------- события ----------

  document.addEventListener('click', (event) => {
    const el = event.target.closest('[data-view], [data-filter], [data-restock], [data-new-order], [data-logout], [data-close]');
    if (!el) return;
    const data = el.dataset;

    if (data.view) go(data.view);
    else if (data.filter) {
      state.filter = data.filter;
      render();
    } else if (data.restock) {
      const product = products.find((p) => p.id === Number(data.restock));
      product.stock += 10;
      render();
      toast(`«${product.name}»: добавлено 10 шт.`);
    } else if ('newOrder' in data) {
      $('orderProduct').innerHTML = products.map((p) => `<option value="${p.id}">${p.name} — ${money(p.price)}</option>`).join('');
      $('overlay').hidden = false;
      $('orderForm').elements.client.focus();
    } else if ('logout' in data) {
      $('app').hidden = true;
      $('auth').hidden = false;
      window.scrollTo(0, 0);
    } else if ('close' in data) $('overlay').hidden = true;
  });

  $('view').addEventListener('change', (event) => {
    const data = event.target.dataset;

    if (data.task) tasks[data.task].done = event.target.checked;
    else if (data.status) {
      orders.find((o) => o.id === Number(data.status)).status = event.target.value;
      render();
      toast(`Заказ #${data.status}: ${event.target.value.toLowerCase()}`);
    } else if (data.toggle) {
      const lists = { products, campaigns, integrations, settings };
      const item = data.toggle === 'products' ? products.find((p) => p.id === Number(data.id)) : lists[data.toggle][data.id];
      item.on = event.target.checked;
      render();
      toast(`${item.name}: ${item.on ? 'включено' : 'выключено'}`);
    }
  });

  $('view').addEventListener('input', (event) => {
    if (event.target.id !== 'find') return;
    state.query = event.target.value;
    render(true);
  });

  $('view').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.target;

    if (form.dataset.form === 'task') {
      const text = form.elements.text.value.trim();
      if (!text) return;
      tasks.push({ text, done: false });
      render();
    } else if (form.dataset.form === 'profile') {
      if (!valid(form)) return;
      state.user = { name: form.elements.name.value.trim(), email: form.elements.email.value.trim(), shop: form.elements.shop.value.trim() };
      render();
      toast('Изменения сохранены');
    }
  });

  $('orderForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.target;
    if (!valid(form)) return;

    const client = form.elements.client.value.trim();
    const product = products.find((p) => p.id === Number(form.elements.product.value));
    const id = orders[0].id + 1;
    orders.unshift({ id, client, product, status: 'Новый', channel: form.elements.channel.value, date: new Date() });

    const known = clients.find((c) => c.name.toLowerCase() === client.toLowerCase());
    if (known) {
      known.orders += 1;
      known.total += product.price;
    } else clients.unshift({ name: client, phone: '—', orders: 1, total: product.price });

    form.reset();
    $('overlay').hidden = true;
    state.filter = 'all';
    state.query = '';
    render();
    toast(`Заказ #${id} создан`);
  });
  $('orderForm').addEventListener('input', (event) => event.target.classList.remove('is-error'));
  $('overlay').addEventListener('click', (event) => {
    if (event.target === $('overlay')) $('overlay').hidden = true;
  });

  $('period').addEventListener('change', (event) => {
    state.period = Number(event.target.value);
    render();
  });

  $('bell').addEventListener('click', () => {
    $('bellPanel').hidden = !$('bellPanel').hidden;
    $('bellDot').hidden = true;
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.pop')) $('bellPanel').hidden = true;
  });

  $('burger').addEventListener('click', () => {
    $('side').classList.add('is-open');
    $('shade').hidden = false;
  });
  $('shade').addEventListener('click', closeSide);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    $('overlay').hidden = true;
    $('bellPanel').hidden = true;
    closeSide();
  });
})();
