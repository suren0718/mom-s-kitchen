// script.js - MOM'S KITCHEN (Full cart system)
// -------------------------------------------------
// Expects images in ./images/... like before.
// Cart stored in localStorage under key 'moms_cart'

document.addEventListener('DOMContentLoaded', () => {
  // MENU: local images
  const MENU = [
    { id: 1, cat: 'indian', name: 'Butter Chicken', desc: 'Creamy tomato gravy, tender chicken', price: 220, img: 'images/butter-chicken.jpg' },
    { id: 2, cat: 'indian', name: 'Paneer Tikka', desc: 'Grilled marinated paneer, smoky spices', price: 180, img: 'images/paneer-tikka.jpg' },
    { id: 3, cat: 'indian', name: 'Dal Makhani', desc: 'Slow-cooked black lentils, buttered', price: 150, img: 'images/dal-makhani.jpg' },
    { id: 4, cat: 'chinese', name: 'Schezwan Noodles', desc: 'Spicy noodles with veggies', price: 160, img: 'images/schezwan-noodles.jpg' },
    { id: 5, cat: 'chinese', name: 'Veg Manchurian', desc: 'Crispy veg balls in tangy sauce', price: 170, img: 'images/veg-manchurian.jpg' },
    { id: 6, cat: 'chinese', name: 'Honey Chilli Potato', desc: 'Sweet & spicy wok-fried potato', price: 140, img: 'images/honey-chilli-potato.jpg' },
    { id: 7, cat: 'desserts', name: 'Gulab Jamun', desc: 'Classic syrupy Indian sweet', price: 80, img: 'images/gulab-jamun.jpg' },
    { id: 8, cat: 'desserts', name: 'Rasmalai', desc: 'Soft cheese discs in sweet milk', price: 90, img: 'images/rasmalai.jpg' },
    { id: 9, cat: 'desserts', name: 'Chocolate Brownie', desc: 'Warm fudge brownie with ice cream', price: 120, img: 'images/chocolate-brownie.jpg' },
    { id: 10, cat: 'beverages', name: 'Masala Chai', desc: 'Traditional spiced tea', price: 40, img: 'images/masala-chai.jpg' },
    { id: 11, cat: 'beverages', name: 'Mango Lassi', desc: 'Creamy mango yogurt drink', price: 75, img: 'images/mango-lassi.jpg' },
    { id: 12, cat: 'beverages', name: 'Cold Coffee', desc: 'Iced coffee with milk & ice cream', price: 85, img: 'images/cold-coffee.jpg' }
  ];

  const SPECIALS = [
    { id: 's1', title: "MOM'S Special Thali", price: 299, img: 'images/special-thali.jpg' },
    { id: 's2', title: "Dragon's Stir-Fry (Veg)", price: 219, img: 'images/dragons-stirfry.jpg' },
    { id: 's3', title: "Homemade Rasmalai (Chef)", price: 99, img: 'images/rasmalai-chef.jpg' }
  ];

  // ---------- Cart helpers ----------
  function readCart() {
    try {
      return JSON.parse(localStorage.getItem('moms_cart') || '{}');
    } catch (e) {
      return {};
    }
  }
  function writeCart(cart) {
    localStorage.setItem('moms_cart', JSON.stringify(cart));
    updateCartBadge();
  }
  function clearCart() {
    localStorage.removeItem('moms_cart');
    updateCartBadge();
  }

  function cartItemCount() {
    const c = readCart();
    return Object.values(c).reduce((s, v) => s + (v.quantity || 0), 0);
  }

  function cartTotalAmount() {
    const c = readCart();
    let total = 0;
    for (const key of Object.keys(c)) {
      total += (c[key].price || 0) * c[key].quantity;
    }
    return total;
  }

  // ---------- SVG placeholder (offline safe) ----------
  function svgPlaceholder(title, width = 400, height = 300) {
    const short = title.length > 26 ? title.slice(0, 23) + '...' : title;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><rect width='100%' height='100%' fill='#fff8f2'/><text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle' font-family='Helvetica, Arial, sans-serif' font-size='18' fill='#c2410c'>${escapeXml(short)}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
  function escapeXml(s) { return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'); }

  // ---------- Render menu ----------
  const menuGrid = document.getElementById('menu-grid');
  function renderMenu(filter = 'all') {
    if (!menuGrid) return;
    menuGrid.innerHTML = '';
    const list = filter === 'all' ? MENU : MENU.filter(it => it.cat === filter);
    list.forEach(item => {
      const card = document.createElement('article');
      card.className = 'menu-card';

      const img = document.createElement('img');
      img.alt = item.name;
      img.src = item.img || svgPlaceholder(item.name);
      img.onerror = function () { this.onerror = null; this.src = svgPlaceholder(item.name); };

      const right = document.createElement('div'); right.style.flex = '1';
      const h4 = document.createElement('h4'); h4.innerHTML = `${escapeXml(item.name)} <small style="float:right;font-weight:600">₹${item.price.toFixed(0)}</small>`;
      const p = document.createElement('p'); p.textContent = item.desc;

      const btnWrap = document.createElement('div'); btnWrap.style.marginTop = '8px';

      // get cart quantity for this item
      const cart = readCart();
      const key = String(item.id);
      const qty = (cart[key] && cart[key].quantity) ? cart[key].quantity : 0;

      // Buttons HTML: Add/Qty + Order (opens order page for single-dish quick order OR checkout handles whole cart)
      btnWrap.innerHTML = `
        <button class="mini" id="add-${item.id}">${qty > 0 ? 'Qty: ' + qty : 'Add'}</button>
        <button class="mini primary" style="margin-left:8px" id="order-now-${item.id}">Order</button>
      `;

      right.appendChild(h4); right.appendChild(p); right.appendChild(btnWrap);
      card.appendChild(img); card.appendChild(right);
      menuGrid.appendChild(card);

      // Add button logic
      const addBtn = btnWrap.querySelector(`#add-${item.id}`);
      addBtn.addEventListener('click', () => {
        const c = readCart();
        if (!c[key]) c[key] = { id: item.id, name: item.name, price: item.price, quantity: 0 };
        c[key].quantity++;
        writeCart(c);
        addBtn.textContent = 'Qty: ' + c[key].quantity;
        // update global cart UI
        renderCartPanel();
      });

      // Order (quick checkout for single item) - adds to cart then opens order page
      const orderNow = btnWrap.querySelector(`#order-now-${item.id}`);
      orderNow.addEventListener('click', () => {
        const c = readCart();
        if (!c[key]) c[key] = { id: item.id, name: item.name, price: item.price, quantity: 1 };
        // ensure at least 1
        if (c[key].quantity < 1) c[key].quantity = 1;
        writeCart(c);
        // go to order page (order.html reads cart from localStorage)
        window.location.href = 'order.html';
      });
    });
  }

  renderMenu();

  // category controls
  document.querySelectorAll('.category-controls button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.category-controls button').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const cat = e.currentTarget.getAttribute('data-cat');
      renderMenu(cat);
    });
  });

  // ---------- Cart panel UI (floating) ----------
  // create floating cart button
  function createCartButton() {
    if (document.getElementById('floating-cart')) return;
    const btn = document.createElement('button');
    btn.id = 'floating-cart';
    btn.innerHTML = `Cart (<span id="cart-count">0</span>)`;
    Object.assign(btn.style, {
      position: 'fixed', right: '18px', bottom: '18px', zIndex: 1200,
      background: '#c2410c', color: '#fff', border: 'none', padding: '10px 14px',
      borderRadius: '28px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,0,0,0.12)'
    });
    document.body.appendChild(btn);
    btn.addEventListener('click', () => {
      toggleCartPanel(true);
    });
  }
  createCartButton();

  // badge update
  function updateCartBadge() {
    const cntEl = document.getElementById('cart-count');
    if (cntEl) cntEl.textContent = cartItemCount();
  }
  updateCartBadge();

  // cart panel element
  function createCartPanel() {
    if (document.getElementById('cart-panel')) return;
    const panel = document.createElement('aside');
    panel.id = 'cart-panel';
    Object.assign(panel.style, {
      position: 'fixed', right: '18px', bottom: '70px', width: '340px', maxHeight: '70vh',
      overflowY: 'auto', background: '#fff', boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
      borderRadius: '12px', zIndex: 1200, padding: '12px', display: 'none'
    });

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong>Your Cart</strong>
        <div>
          <button id="clear-cart" style="margin-right:8px;background:#eee;border:none;padding:6px;border-radius:6px;cursor:pointer">Clear</button>
          <button id="close-cart" style="background:#eee;border:none;padding:6px;border-radius:6px;cursor:pointer">Close</button>
        </div>
      </div>
      <div id="cart-items"></div>
      <div id="cart-summary" style="margin-top:10px"></div>
      <div style="margin-top:10px;display:flex;gap:8px">
        <button id="checkout-btn" style="flex:1;background:#c2410c;color:white;border:none;padding:10px;border-radius:8px;cursor:pointer">Checkout</button>
        <button id="view-orders" style="background:#f3f4f6;border:none;padding:10px;border-radius:8px;cursor:pointer">Orders</button>
      </div>
    `;
    document.body.appendChild(panel);

    document.getElementById('close-cart').addEventListener('click', () => toggleCartPanel(false));
    document.getElementById('clear-cart').addEventListener('click', () => {
      if (confirm('Clear cart?')) { clearCart(); renderCartPanel(); renderMenu(); }
    });
    document.getElementById('checkout-btn').addEventListener('click', () => {
      // proceed to order page (reads cart from localStorage)
      window.location.href = 'order.html';
    });
    document.getElementById('view-orders').addEventListener('click', () => {
      // optionally view past orders saved
      const orders = JSON.parse(localStorage.getItem('moms_orders') || '[]');
      alert('You have ' + orders.length + ' past orders (stored locally).');
    });
  }
  createCartPanel();

  // render cart contents into panel
  function renderCartPanel() {
    const panel = document.getElementById('cart-panel');
    const itemsEl = document.getElementById('cart-items');
    const summaryEl = document.getElementById('cart-summary');
    if (!panel || !itemsEl || !summaryEl) return;
    const cart = readCart();
    itemsEl.innerHTML = '';
    const keys = Object.keys(cart);
    if (keys.length === 0) {
      itemsEl.innerHTML = '<div style="padding:12px;color:#6b7280">Your cart is empty.</div>';
      summaryEl.innerHTML = '';
      updateCartBadge();
      return;
    }

    keys.forEach(k => {
      const it = cart[k];
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '8px';
      row.style.alignItems = 'center';
      row.style.padding = '8px 0';
      row.innerHTML = `
        <div style="flex:1">
          <div style="font-weight:600">${escapeXml(it.name)}</div>
          <div style="color:#6b7280;font-size:0.9rem">₹${it.price} × ${it.quantity} = ₹${(it.price*it.quantity).toFixed(0)}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="cart-plus" data-key="${k}" style="padding:6px;border-radius:6px;border:none;background:#e6f0ff;cursor:pointer">+</button>
          <button class="cart-minus" data-key="${k}" style="padding:6px;border-radius:6px;border:none;background:#ffecec;cursor:pointer">-</button>
          <button class="cart-remove" data-key="${k}" style="padding:6px;border-radius:6px;border:none;background:#f3f4f6;cursor:pointer">Remove</button>
        </div>
      `;
      itemsEl.appendChild(row);
    });

    // attach listeners
    itemsEl.querySelectorAll('.cart-plus').forEach(b => {
      b.addEventListener('click', () => {
        const k = b.dataset.key;
        const c = readCart();
        c[k].quantity++;
        writeCart(c);
        renderCartPanel();
        renderMenu();
      });
    });
    itemsEl.querySelectorAll('.cart-minus').forEach(b => {
      b.addEventListener('click', () => {
        const k = b.dataset.key;
        const c = readCart();
        c[k].quantity = Math.max(0, (c[k].quantity || 0) - 1);
        if (c[k].quantity <= 0) delete c[k];
        writeCart(c);
        renderCartPanel();
        renderMenu();
      });
    });
    itemsEl.querySelectorAll('.cart-remove').forEach(b => {
      b.addEventListener('click', () => {
        const k = b.dataset.key;
        const c = readCart();
        delete c[k];
        writeCart(c);
        renderCartPanel();
        renderMenu();
      });
    });

    // summary
    const total = cartTotalAmount();
    summaryEl.innerHTML = `<div style="font-weight:700">Total: ₹${total.toFixed(0)}</div>`;
    updateCartBadge();
  }

  // show/hide panel
  function toggleCartPanel(show) {
    const panel = document.getElementById('cart-panel');
    if (!panel) return;
    panel.style.display = show ? 'block' : 'none';
    if (show) renderCartPanel();
  }

  // update on load
  updateCartBadge();
  renderCartPanel();

  // ---------- Specials rendering (with Order button adding to cart) ----------
  const specialsGrid = document.getElementById('specials-grid');
  if (specialsGrid) {
    specialsGrid.innerHTML = '';
    SPECIALS.forEach(s => {
      const d = document.createElement('div'); d.className = 'special-card';
      const img = document.createElement('img'); img.alt = s.title; img.src = s.img || svgPlaceholder(s.title, 800, 600);
      img.onerror = function () { this.onerror = null; this.src = svgPlaceholder(s.title, 800, 600); };
      const body = document.createElement('div'); body.style.padding = '12px'; body.innerHTML = `<h4 style="margin:0">${escapeXml(s.title)}</h4><p style="color:#6b7280;margin:6px 0 0">₹${s.price.toFixed(0)}</p>`;
      const actions = document.createElement('div'); actions.style.padding = '12px 12px 18px';
      actions.innerHTML = `<button class="mini" id="special-order-${s.id}">Order</button>`;
      d.appendChild(img); d.appendChild(body); d.appendChild(actions); specialsGrid.appendChild(d);
      document.getElementById(`special-order-${s.id}`).addEventListener('click', () => {
        const c = readCart();
        const key = 'special-' + s.id;
        if (!c[key]) c[key] = { id: key, name: s.title, price: s.price, quantity: 0 };
        c[key].quantity++;
        writeCart(c);
        renderCartPanel();
        renderMenu();
      });
    });
  }

  // ---------- Reservation / contact / footer handlers as before ----------
  // Footer year
  const yearEl = document.getElementById('year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  // reservation (unchanged, same validation)
  const reserveForm = document.getElementById('reserve-form');
  const rMsg = document.getElementById('reserve-msg');
  if (reserveForm) {
    reserveForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      if (!rMsg) return;
      rMsg.textContent = '';
      const name = document.getElementById('r-name').value.trim();
      const date = document.getElementById('r-date').value;
      const time = document.getElementById('r-time').value;
      const people = Number(document.getElementById('r-people').value);

      if (!name || !date || !time || !people) {
        rMsg.style.color = 'crimson'; rMsg.textContent = 'Please complete all required fields.'; return;
      }
      const selected = new Date(date + 'T' + time); const now = new Date();
      if (selected < now) { rMsg.style.color = 'crimson'; rMsg.textContent = 'Please choose a future date/time.'; return; }

      const reservations = JSON.parse(localStorage.getItem('moms_reservations') || '[]');
      const res = { id: Date.now(), name, date, time, people, phone: document.getElementById('r-phone').value.trim() };
      reservations.push(res); localStorage.setItem('moms_reservations', JSON.stringify(reservations));
      rMsg.style.color = 'green'; rMsg.textContent = `Reservation received for ${name} on ${date} at ${time}. We'll contact you to confirm.`; reserveForm.reset();
    });
  }

  // contact
  const contactForm = document.getElementById('contact-form');
  const cMsg = document.getElementById('contact-msg');
  if (contactForm) {
    contactForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      if (!cMsg) return;
      cMsg.textContent = '';
      const name = document.getElementById('c-name').value.trim();
      const email = document.getElementById('c-email').value.trim();
      const message = document.getElementById('c-message').value.trim();
      if (!name || !email || !message) { cMsg.style.color = 'crimson'; cMsg.textContent = 'Please fill all fields.'; return; }
      cMsg.style.color = 'green'; cMsg.textContent = 'Thanks — we received your message and will reply soon!'; contactForm.reset();
    });
  }

  // mobile nav close on link click
  const mobileToggle = document.getElementById('mobile-toggle');
  const mainNav = document.getElementById('main-nav');
  document.querySelectorAll('.main-nav a[href^="#"]').forEach(a => {
    a.addEventListener('click', () => {
      if (mainNav) mainNav.setAttribute('data-open', 'false');
      if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // global image error fallback (safety net)
  window.addEventListener('error', function(e) {
    const el = e.target; if (el && el.tagName === 'IMG' && el.src) { el.onerror = null; const name = el.alt || 'Image'; el.src = svgPlaceholder(name); }
  }, true);
});
