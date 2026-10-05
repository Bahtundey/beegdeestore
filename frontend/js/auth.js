
function getBase() {
  return window.location.pathname.includes('/admin/') ? '../' : '';
}



function getCurrentUser() {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function isLoggedIn() {
  return !!getToken();
}

function isAdmin() {
  const user = getCurrentUser();
  return !!user && user.role === 'admin';
}

function saveSession(token, user) {
  setToken(token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearSession() {
  removeToken();
  localStorage.removeItem('user');
}

function logout() {
  clearSession();
  invalidateCartCache();
  window.location.href = getBase() + 'login.html';
}


const CURRENCY = 'NGN';
const CURRENCY_SYMBOLS = { NGN: '₦', USD: '$', GHS: '₵', ZAR: 'R', KES: 'KSh' };


function formatCurrency(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return '—';
  const symbol = CURRENCY_SYMBOLS[CURRENCY] || (CURRENCY + ' ');
  return symbol + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


function formatPrice(value) {
  return formatCurrency(value);
}


function statusBadge(status) {
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : status;
  return '<span class="badge badge-' + escapeHtml(status) + '">' + escapeHtml(label) + '</span>';
}


const LOW_STOCK_THRESHOLD = 10;


function stockBadge(stock) {
  const n = Number(stock);
  if (n <= 0) return '<span class="badge badge-out">Out of stock</span>';
  if (n <= LOW_STOCK_THRESHOLD) return '<span class="badge badge-low">Only ' + n + ' left</span>';
  return '<span class="badge badge-ok">In stock</span>';
}


function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}



const ICONS = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57L23 6.05H5.12"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
  minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
  headset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a9 9 0 0 1 18 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>',
  card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  'eye-off': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>',
};

function icon(name) {
  return ICONS[name] || '';
}


function initPasswordToggles() {
  document.querySelectorAll('.password-field').forEach((wrap) => {
    const input = wrap.querySelector('input');
    const btn = wrap.querySelector('.password-toggle');
    if (!input || !btn) return;
    btn.innerHTML = icon('eye');
    btn.addEventListener('click', () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.innerHTML = icon(show ? 'eye-off' : 'eye');
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      input.focus();
    });
  });
}



function showToast(message, type) {
  type = type || 'success';
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML =
    '<span>' + icon(type === 'error' ? 'close' : 'check') + '</span><span>' +
    escapeHtml(message) + '</span>';
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}



let _cartCache = null;


async function fetchCart(force) {
  if (_cartCache && !force) return _cartCache;
  if (!getToken()) return { _id: null, items: [], total: 0 };
  try {
    const res = await API.get('/carts');
    
    _cartCache = res && res.data ? res.data : { _id: null, items: [], total: 0 };
  } catch (e) {
    _cartCache = { _id: null, items: [], total: 0 };
  }
  return _cartCache;
}


function invalidateCartCache() {
  _cartCache = null;
}

function cartProductMap(cart) {
  const m = {};
  (cart.items || []).forEach((it) => {
    if (it.product && it.product._id) m[it.product._id] = it.quantity;
  });
  return m;
}


function cartTotalQuantity(cart) {
  return (cart.items || []).reduce((s, it) => s + (it.quantity || 0), 0);
}


async function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-count');
  if (!badges.length) return;
  const cart = await fetchCart();
  const total = cartTotalQuantity(cart);
  badges.forEach((b) => {
    if (Number(b.textContent) !== total) {
      b.textContent = String(total);
      b.classList.remove('bump');
      void b.offsetWidth; 
      b.classList.add('bump');
    }
    b.classList.toggle('visible', total > 0);
  });
}



async function addToCart(productId, quantity) {
  if (!getToken()) {
    showToast('Please sign in to add items to your cart', 'error');
    window.location.href = getBase() + 'login.html';
    return false;
  }
  try {
    await API.post('/carts', { productId, quantity: quantity || 1 });
    invalidateCartCache();
    updateCartBadge();
    showToast('Product added to cart');
    return true;
  } catch (err) {
    showToast(err.message, 'error');
    return false;
  }
}


function renderNavbar() {
  const el = document.getElementById('navbar');
  if (!el) return;

  const base = getBase();
  const loggedIn = isLoggedIn();
  const admin = isAdmin();

  
  let accountHref = base + 'login.html';
  if (loggedIn) accountHref = base + 'profile.html';

  let drawerAuth = '';
  if (loggedIn) {
    drawerAuth =
      '<a href="' + base + 'profile.html" class="nav-link">' + icon('user') + 'Profile</a>' +
      '<a href="' + base + 'orders.html" class="nav-link">' + icon('box') + 'Orders</a>' +
      (admin ? '<a href="' + base + 'admin/dashboard.html" class="nav-link">' + icon('grid') + 'Admin dashboard</a>' : '') +
      '<a href="#" class="nav-link" id="logout-link">' + icon('logout') + 'Logout</a>';
  } else {
    drawerAuth =
      '<a href="' + base + 'login.html" class="nav-link">' + icon('user') + 'Sign in</a>' +
      '<a href="' + base + 'register.html" class="nav-link">Create account</a>';
  }

  el.innerHTML =
    '<div class="nav-container">' +
    '  <a href="' + base + 'index.html" class="brand">BeegDee<span>Store</span></a>' +
    '  <nav class="nav-links" id="nav-links">' +
    '    <a href="' + base + 'index.html" class="nav-link" data-nav="home">Home</a>' +
    '    <a href="' + base + 'products.html" class="nav-link" data-nav="products">Shop</a>' +
    '    <span class="nav-link has-dropdown" data-nav="categories" tabindex="0">Categories ' + icon('chevron') +
    '      <span class="dropdown" id="categories-menu"></span>' +
    '    </span>' +
    (admin ? '<a href="' + base + 'admin/dashboard.html" class="nav-link" data-nav="admin">Admin</a>' : '') +
    '    <span class="nav-auth-mobile">' + drawerAuth + '</span>' +
    '  </nav>' +
    '  <div class="nav-actions">' +
    '    <div class="nav-search">' + icon('search')  +
    '      <input type="search" id="nav-search-input" placeholder="Search products…" aria-label="Search products">' +
    '    </div>' +
    '    <a href="' + accountHref + '" class="icon-btn" title="Account" aria-label="Account">' + icon('user') + '</a>' +
    '    <a href="' + base + 'cart.html" class="icon-btn" title="Cart" aria-label="Cart">' + icon('cart') + '<span class="cart-count">0</span></a>' +
    '    <button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation"><span></span><span></span><span></span></button>' +
    '  </div>' +
    '</div>';

 
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });


  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }

  
  const searchInput = document.getElementById('nav-search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = searchInput.value.trim();
        window.location.href = base + 'products.html' + (q ? '?q=' + encodeURIComponent(q) : '');
      }
    });
  }

  
  const catTrigger = el.querySelector('[data-nav="categories"]');
  const catMenu = document.getElementById('categories-menu');
  if (catTrigger && catMenu) {
    const load = () => populateNavCategories(catMenu);
    catTrigger.addEventListener('mouseenter', load);
    catTrigger.addEventListener('click', load);
    catTrigger.addEventListener('focus', load);
  }

 
  markActiveNav();
}

function populateNavCategories(container) {
  if (container.dataset.loaded === '1') return;
  container.dataset.loaded = '1';
  API.get('/products')
    .then((res) => {
      const cats = [...new Set((res.data || []).map((p) => p.category).filter(Boolean))].sort();
      container.innerHTML = cats.length
        ? cats
            .map((c) => '<a href="' + getBase() + 'products.html?category=' + encodeURIComponent(c) + '">' + escapeHtml(c) + '</a>')
            .join('')
        : '<a href="' + getBase() + 'products.html">All products</a>';
    })
    .catch(() => {
      container.dataset.loaded = '';
    });
}

function markActiveNav() {
  const path = window.location.pathname;
  const links = document.querySelectorAll('.nav-link[data-nav]');
  links.forEach((l) => {
    const nav = l.getAttribute('data-nav');
    if (nav === 'home' && (path.endsWith('index.html') || path.endsWith('/'))) l.classList.add('active');
    else if (nav === 'products' && (path.endsWith('products.html') || path.endsWith('product-details.html'))) l.classList.add('active');
  });
}



function renderFooter() {
  const el = document.querySelector('footer.footer');
  if (!el) return;
  const base = getBase();

  el.innerHTML =
    '<div class="container">' +
    '  <div class="footer-grid">' +
    '    <div>' +
    '      <div class="footer-brand">BeegDee<span>Store</span></div>' +
    '      <p class="footer-desc">A curated collection of everyday products, delivered with care. Shop confidently with secure payments and reliable service.</p>' +
    '    </div>' +
    '    <div>' +
    '      <h4>Shop</h4>' +
    '      <a href="' + base + 'products.html">All products</a>' +
    '      <a href="' + base + 'index.html">Home</a>' +
    '      <a href="' + base + 'cart.html">Cart</a>' +
    '    </div>' +
    '    <div>' +
    '      <h4>Account</h4>' +
    '      <a href="' + base + 'login.html">Sign in</a>' +
    '      <a href="' + base + 'register.html">Create account</a>' +
    '      <a href="' + base + 'profile.html">Profile</a>' +
    '      <a href="' + base + 'orders.html">Orders</a>' +
    '    </div>' +
    '    <div>' +
    '      <h4>Store</h4>' +
    '      <a href="' + base + 'products.html">Shop</a>' +
    '      <a href="' + base + 'cart.html">Checkout</a>' +
    '    </div>' +
    '  </div>' +
    '  <div class="footer-bottom">' +
    '    <span>© ' + new Date().getFullYear() + ' BeegDee Store. All rights reserved.</span>' +
    '    <span>Secure payments powered by Paystack.</span>' +
    '  </div>' +
    '</div>';
}


async function requireAuth() {
  if (!getToken()) {
    window.location.href = getBase() + 'login.html';
    return null;
  }
  try {
    const res = await API.get('/auth/me');
    if (!res.data) throw new Error('No user');
    localStorage.setItem('user', JSON.stringify(res.data));
    return res.data;
  } catch (e) {
    clearSession();
    window.location.href = getBase() + 'login.html';
    return null;
  }
}


async function requireAdmin() {
  const user = await requireAuth();
  if (!user) return null;
  if (user.role !== 'admin') {
    window.location.href = getBase() + 'index.html';
    return null;
  }
  return user;
}


function enhanceAdminSidebar() {
  const sidebar = document.querySelector('.admin-sidebar');
  if (!sidebar) return;

  const title = sidebar.querySelector('.admin-title');
  if (title && !sidebar.querySelector('.admin-brand')) {
    const brand = document.createElement('div');
    brand.className = 'admin-brand';
    brand.innerHTML = '<span>BeegDee Store</span>';
    sidebar.insertBefore(brand, title);
  }

  sidebar.querySelectorAll('a').forEach((a) => {
    
    if (a.childNodes[0] && a.childNodes[0].nodeType === 3) {
      a.childNodes[0].nodeValue = a.childNodes[0].nodeValue.replace(/^←\s*/, '');
    }
    if (a.querySelector('svg')) return;
    const text = (a.textContent || '').trim().toLowerCase();
    let name = null;
    if (text.includes('dashboard')) name = 'grid';
    else if (text === 'products') name = 'tag';
    else if (text.includes('add product')) name = 'plus';
    else if (text.includes('orders')) name = 'box';
    else if (text.includes('users')) name = 'users';
    else if (text.includes('back to store')) name = 'arrow';
    if (name) a.insertAdjacentHTML('afterbegin', icon(name));
  });
}


document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
  enhanceAdminSidebar();
  updateCartBadge();

  
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 4);
    }, { passive: true });
  }
});
