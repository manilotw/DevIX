// Демо «Интернет-магазин»: каталог, избранное, корзина и оформление заказа.
// Бэкенда нет: всё хранится в памяти страницы и пропадает при обновлении.
(function () {
  // фото товаров лежат в static/img/demo/shop
  const IMG = '/static/img/demo/shop/';
  const PRODUCTS = [
    { id: 1, name: 'Беспроводные наушники', price: 79990, cat: 'accessories', img: 'headphones', hit: true, desc: 'Активное шумоподавление и до 30 часов работы без подзарядки.' },
    { id: 2, name: 'Смарт-часы', price: 129990, cat: 'accessories', img: 'watch', hit: true, isNew: true, desc: 'Пульс, сон и тренировки на ярком экране. Держат заряд до 5 дней.' },
    { id: 3, name: 'Кроссовки Urban', price: 54990, cat: 'shoes', img: 'sneakers', hit: true, desc: 'Лёгкие кроссовки из кожи и замши на каждый день.' },
    { id: 4, name: 'Сумка Classic', price: 89990, cat: 'accessories', img: 'cat-bag', isNew: true, desc: 'Сумка из плотной кожи с короткой ручкой и съёмным ремнём.' },
    { id: 5, name: 'Свитер оверсайз', price: 31990, old: 39990, cat: 'clothes', img: 'cat-clothes', desc: 'Мягкий свитер свободного кроя из шерсти мериноса.' },
    { id: 6, name: 'Солнцезащитные очки', price: 27990, old: 34990, cat: 'accessories', img: 'sunglasses', desc: 'Линзы с защитой UV400 в лёгкой ацетатной оправе.' },
    { id: 7, name: 'Настольная лампа', price: 24990, cat: 'home', img: 'lamp', isNew: true, desc: 'Матовое рифлёное стекло и тёплый рассеянный свет. Работает от USB.' },
    { id: 8, name: 'Аромадиффузор', price: 14990, cat: 'home', img: 'diffuser', pos: 'center 80%', desc: 'Стеклянный флакон с палочками. Аромат сандала и ванили, хватает на 2 месяца.' },
  ];

  const FILTERS = {
    all: { title: 'Каталог', test: () => true },
    clothes: { title: 'Одежда', test: (p) => p.cat === 'clothes' },
    shoes: { title: 'Обувь', test: (p) => p.cat === 'shoes' },
    accessories: { title: 'Аксессуары', test: (p) => p.cat === 'accessories' },
    home: { title: 'Для дома', test: (p) => p.cat === 'home' },
    new: { title: 'Новинки', test: (p) => p.isNew },
    sale: { title: 'Со скидкой', test: (p) => p.old },
    fav: { title: 'Избранное', test: (p) => state.fav.has(p.id) },
  };

  const state = { filter: 'all', query: '', fav: new Set(), cart: new Map(), modal: null, modalQty: 1 };

  const $ = (id) => document.getElementById(id);
  const money = (n) => n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₸';
  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  // pos - какую часть фото показывать, если оно не помещается в рамку целиком
  const photo = (p) => `<img src="${IMG}${p.img}.jpg" alt="" loading="lazy"${p.pos ? ` style="object-position:${p.pos}"` : ''}>`;
  const priceHtml = (p) => `<div class="price">${money(p.price)}${p.old ? `<s>${money(p.old)}</s>` : ''}</div>`;
  const favHtml = (p) =>
    `<button type="button" class="icon-btn fav${state.fav.has(p.id) ? ' is-on' : ''}" data-fav="${p.id}" aria-label="В избранное"><svg><use href="#s-heart"/></svg></button>`;

  // ---------- каталог ----------

  function renderHits() {
    $('hits').innerHTML = PRODUCTS.filter((p) => p.hit)
      .map((p) => `<article class="hit" data-open="${p.id}">${photo(p)}<div><b>${p.name}</b>${priceHtml(p)}</div>${favHtml(p)}</article>`)
      .join('');
  }

  function renderGrid() {
    const filter = FILTERS[state.filter];
    const query = state.query.trim().toLowerCase();
    const list = PRODUCTS.filter((p) => filter.test(p) && (!query || p.name.toLowerCase().includes(query)));

    $('catalogTitle').textContent = query ? `Поиск: «${state.query.trim()}»` : filter.title;
    $('empty').hidden = list.length > 0;
    $('grid').innerHTML = list
      .map((p) => {
        const tag = p.old ? '<span class="tag tag--sale">Скидка</span>' : p.isNew ? '<span class="tag">Новинка</span>' : '';
        const inCart = state.cart.has(p.id);
        return `<article class="product">
          <span class="product__art" data-open="${p.id}">${photo(p)}${tag}</span>
          <div class="product__body">
            <span class="product__name" data-open="${p.id}">${p.name}</span>
            ${priceHtml(p)}
            <button type="button" class="btn btn--primary btn--sm${inCart ? ' is-added' : ''}" data-add="${p.id}">${inCart ? 'В корзине' : 'В корзину'}</button>
          </div>
          ${favHtml(p)}
        </article>`;
      })
      .join('');

    document.querySelectorAll('.chip').forEach((chip) => chip.classList.toggle('is-active', !query && chip.dataset.filter === state.filter));
    $('favBtn').classList.toggle('is-on', state.filter === 'fav');
  }

  function setFilter(name) {
    state.filter = name;
    state.query = '';
    $('search').value = '';
    renderGrid();
  }

  // ---------- избранное и корзина ----------

  function setBadge(el, count) {
    el.textContent = count;
    el.hidden = count === 0;
  }

  function toggleFav(id) {
    if (state.fav.has(id)) state.fav.delete(id);
    else state.fav.add(id);
    setBadge($('favCount'), state.fav.size);
    renderHits();
    renderGrid();
  }

  function cartTotal() {
    let sum = 0;
    state.cart.forEach((qty, id) => (sum += byId(id).price * qty));
    return sum;
  }

  function addToCart(id, qty) {
    state.cart.set(id, (state.cart.get(id) || 0) + qty);
    renderCart();
    renderGrid();
    toast(`«${byId(id).name}» в корзине`);
  }

  function changeQty(id, delta) {
    const qty = (state.cart.get(id) || 0) + delta;
    if (qty <= 0) state.cart.delete(id);
    else state.cart.set(id, qty);
    renderCart();
    renderGrid();
  }

  function renderCart() {
    let count = 0;
    let html = '';
    state.cart.forEach((qty, id) => {
      const p = byId(id);
      count += qty;
      html += `<div class="item">
        ${photo(p)}
        <div>
          <b>${p.name}</b><span>${money(p.price)}</span>
          <div class="qty">
            <button type="button" data-qty="${id}" data-delta="-1" aria-label="Меньше">−</button>
            <span>${qty}</span>
            <button type="button" data-qty="${id}" data-delta="1" aria-label="Больше">+</button>
          </div>
        </div>
        <button type="button" class="icon-btn item__remove" data-remove="${id}" aria-label="Удалить"><svg><use href="#s-close"/></svg></button>
      </div>`;
    });

    $('cartList').innerHTML = html;
    $('cartEmpty').hidden = count > 0;
    $('cartFoot').hidden = count === 0;
    $('cartTotal').textContent = $('checkoutTotal').textContent = money(cartTotal());
    setBadge($('cartCount'), count);
  }

  // ---------- окна ----------

  function showStep(name) {
    $('stepCart').hidden = name !== 'cart';
    $('stepCheckout').hidden = name !== 'checkout';
    $('stepDone').hidden = name !== 'done';
    $('drawerTitle').textContent = name === 'checkout' ? 'Оформление заказа' : name === 'done' ? 'Готово' : 'Корзина';
  }

  function openDrawer() {
    closeAll();
    $('toast').hidden = true;
    showStep('cart');
    $('drawer').hidden = false;
    $('overlay').hidden = false;
    document.body.classList.add('is-locked');
  }

  function openModal(id) {
    const p = byId(id);
    state.modal = id;
    state.modalQty = 1;
    $('modalArt').src = `${IMG}${p.img}.jpg`;
    $('modalName').textContent = p.name;
    $('modalDesc').textContent = p.desc;
    $('modalPrice').innerHTML = money(p.price) + (p.old ? `<s>${money(p.old)}</s>` : '');
    $('modalTag').textContent = p.old ? 'Скидка' : p.isNew ? 'Новинка' : p.hit ? 'Хит продаж' : '';
    $('modalTag').hidden = !$('modalTag').textContent;
    $('modalQty').textContent = 1;
    $('modal').hidden = false;
    $('overlay').hidden = false;
    document.body.classList.add('is-locked');
  }

  function closeAll() {
    $('modal').hidden = true;
    $('drawer').hidden = true;
    $('overlay').hidden = true;
    document.body.classList.remove('is-locked');
  }

  let toastTimer;
  function toast(text) {
    $('toast').textContent = text;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ($('toast').hidden = true), 2200);
  }

  // ---------- события ----------

  document.addEventListener('click', (event) => {
    const el = event.target.closest('[data-fav], [data-add], [data-open], [data-filter], [data-qty], [data-remove], [data-close]');
    if (!el) return;
    const data = el.dataset;

    if (data.fav) toggleFav(Number(data.fav));
    else if (data.add) addToCart(Number(data.add), 1);
    else if (data.open) openModal(Number(data.open));
    else if (data.filter) setFilter(data.filter);
    else if (data.qty) changeQty(Number(data.qty), Number(data.delta));
    else if (data.remove) changeQty(Number(data.remove), -Infinity);
    else if ('close' in data) closeAll();
  });

  $('overlay').addEventListener('click', closeAll);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAll();
  });

  $('cartBtn').addEventListener('click', openDrawer);
  $('favBtn').addEventListener('click', () => {
    setFilter(state.filter === 'fav' ? 'all' : 'fav');
    $('catalog').scrollIntoView();
  });

  $('search').addEventListener('input', (event) => {
    state.query = event.target.value;
    state.filter = 'all';
    renderGrid();
  });
  $('search').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') $('catalog').scrollIntoView();
  });

  $('modalMinus').addEventListener('click', () => ($('modalQty').textContent = state.modalQty = Math.max(1, state.modalQty - 1)));
  $('modalPlus').addEventListener('click', () => ($('modalQty').textContent = state.modalQty = Math.min(9, state.modalQty + 1)));
  $('modalAdd').addEventListener('click', () => {
    addToCart(state.modal, state.modalQty);
    closeAll();
  });

  $('toCheckout').addEventListener('click', () => showStep('checkout'));
  $('backToCart').addEventListener('click', () => showStep('cart'));

  const checkout = $('stepCheckout');
  checkout.addEventListener('input', (event) => event.target.classList.remove('is-error'));
  checkout.addEventListener('submit', (event) => {
    event.preventDefault();

    let firstEmpty = null;
    checkout.querySelectorAll('[required]').forEach((input) => {
      const empty = !input.value.trim();
      input.classList.toggle('is-error', empty);
      if (empty && !firstEmpty) firstEmpty = input;
    });
    if (firstEmpty) {
      firstEmpty.focus();
      return;
    }

    const data = new FormData(checkout);
    const number = 'V-' + (1040 + Math.floor(Math.random() * 900));
    $('doneText').textContent =
      `${data.get('name').trim()}, заказ ${number} на ${money(cartTotal())} принят. ` +
      `${data.get('delivery')}, оплата: ${data.get('pay').toLowerCase()}.`;

    state.cart.clear();
    checkout.reset();
    renderCart();
    renderGrid();
    showStep('done');
  });

  renderHits();
  renderGrid();
  renderCart();
})();
