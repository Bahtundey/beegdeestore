
function skeletonGrid(count) {
  const cells = Array.from({ length: count || 8 })
    .map(
      () =>
        '<div class="skeleton-card"><div class="skeleton sk-img"></div>' +
        '<div class="sk-body"><div class="skeleton sk-line short"></div>' +
        '<div class="skeleton sk-line"></div><div class="skeleton sk-line"></div></div></div>'
    )
    .join('');
  return '<div class="product-grid">' + cells + '</div>';
}


function productCardHtml(product, inCartQty) {
  const imageHtml = product.image
    ? '<img src="' + product.image + '" alt="' + escapeHtml(product.name) + '" loading="lazy">'
    : '<span class="placeholder">' + escapeHtml((product.name || '?').charAt(0).toUpperCase()) + '</span>';

  const stockHtml = stockBadge(product.stock);

  const qty = inCartQty || 0;
  const addBtn =
    product.stock <= 0
      ? '<button class="btn btn-secondary btn-sm" disabled>Out of stock</button>'
      : qty > 0
        ? '<button class="btn btn-success btn-sm add-to-cart" data-id="' + product._id + '">' + icon('check') + ' In cart · ' + qty + '</button>'
        : '<button class="btn btn-primary btn-sm add-to-cart" data-id="' + product._id + '">Add to cart</button>';

  return (
    '<article class="product-card" data-product-id="' + product._id + '">' +
    '  <a class="product-image" href="product-details.html?id=' + product._id + '">' + imageHtml + '</a>' +
    '  <div class="product-body">' +
    '    <span class="product-category">' + escapeHtml(product.category || '') + '</span>' +
    '    <h3 class="product-name"><a href="product-details.html?id=' + product._id + '">' + escapeHtml(product.name) + '</a></h3>' +
    '    <span class="product-price">' + formatPrice(product.price) + '</span>' +
    '    <span class="product-stock">' + stockHtml + '</span>' +
    '    <div class="product-actions">' +
    '      <a href="product-details.html?id=' + product._id + '" class="btn btn-secondary btn-sm">View</a>' +
    '      ' + addBtn +
    '    </div>' +
    '  </div>' +
    '</article>'
  );
}

function renderProducts(container, products, inCartMap) {
  const map = inCartMap || {};
  if (!products.length) {
    container.innerHTML =
      '<div class="empty-state">' +
      '  <div class="empty-icon">' + icon('box') + '</div>' +
      '  <h3>No products found</h3>' +
      '  <p>Try a different search or category.</p>' +
      '</div>';
    return;
  }
  container.innerHTML =
    '<div class="product-grid">' +
    products.map((p) => productCardHtml(p, map[p._id] || 0)).join('') +
    '</div>';
}


async function getCartMapForPage() {
  if (!getToken()) return {};
  try {
    const cart = await fetchCart();
    return cartProductMap(cart);
  } catch (e) {
    return {};
  }
}


async function updateInCartState() {
  if (!getToken()) return;
  const map = await getCartMapForPage();
  document.querySelectorAll('.product-card[data-product-id]').forEach((card) => {
    const id = card.getAttribute('data-product-id');
    const qty = map[id] || 0;
    const btn = card.querySelector('.add-to-cart');
    if (!btn) return;
    if (qty > 0) {
      btn.className = 'btn btn-success btn-sm add-to-cart';
      btn.innerHTML = icon('check') + ' In cart · ' + qty;
    } else {
      btn.className = 'btn btn-primary btn-sm add-to-cart';
      btn.textContent = 'Add to cart';
    }
  });
}



async function loadHome() {
  const featured = document.getElementById('featured-products');
  const categoriesEl = document.getElementById('home-categories');
  const newArrivals = document.getElementById('new-arrivals');
  if (!featured && !categoriesEl && !newArrivals) return;

  if (featured) featured.innerHTML = skeletonGrid(8);

  try {
    const res = await API.get('/products');
    const products = res.data || [];
    const inCart = await getCartMapForPage();

    
    const heroVisual = document.getElementById('hero-visual');
    if (heroVisual && products.length) {
      const p = products.find((x) => x.image) || products[0];
      const img = p.image
        ? '<img src="' + p.image + '" alt="' + escapeHtml(p.name) + '">'
        : '<span class="placeholder">' + escapeHtml((p.name || '?').charAt(0).toUpperCase()) + '</span>';
      heroVisual.innerHTML = img + '<span class="hero-tag">' + escapeHtml(p.name) + ' · ' + formatPrice(p.price) + '</span>';
    }

    if (featured) renderProducts(featured, products.slice(0, 8), inCart);

    if (newArrivals) {
      const recent = [...products]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 4);
      renderProducts(newArrivals, recent, inCart);
    }

    if (categoriesEl) {
      const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
      if (!categories.length) {
        categoriesEl.innerHTML = '<p class="text-muted">No categories yet.</p>';
      } else {
        categoriesEl.innerHTML =
          '<div class="category-grid">' +
          categories
            .map((c) => {
              const count = products.filter((p) => p.category === c).length;
              return (
                '<a class="category-card" href="products.html?category=' + encodeURIComponent(c) + '">' +
                '  <span class="category-icon">' + icon('tag') + '</span>' +
                '  <span class="category-name">' + escapeHtml(c) + '</span>' +
                '  <span class="category-count">' + count + ' item' + (count === 1 ? '' : 's') + '</span>' +
                '</a>'
              );
            })
            .join('') +
          '</div>';
      }
    }
  } catch (err) {
    if (featured) featured.innerHTML = '<div class="alert alert-error">Failed to load products: ' + escapeHtml(err.message) + '</div>';
  }
}



let activeCategory = '';
let searchTerm = '';
let allProducts = [];

async function initProductsPage() {
  const container = document.getElementById('products-list');
  if (!container) return;

  
  const params = new URLSearchParams(window.location.search);
  activeCategory = params.get('category') || '';
  searchTerm = params.get('q') || '';
  const searchInput = document.getElementById('product-search');
  if (searchInput && searchTerm) searchInput.value = searchTerm;

  container.innerHTML = skeletonGrid(8);

  try {
    const res = await API.get('/products');
    allProducts = res.data || [];

    const filterBar = document.getElementById('category-filters');
    const categories = [...new Set(allProducts.map((p) => p.category).filter(Boolean))].sort();

    if (filterBar) {
      filterBar.innerHTML =
        '<button class="filter-chip" data-category="">All</button>' +
        categories.map((c) => '<button class="filter-chip" data-category="' + escapeHtml(c) + '">' + escapeHtml(c) + '</button>').join('');

      filterBar.querySelectorAll('.filter-chip').forEach((chip) => {
        if (chip.getAttribute('data-category') === activeCategory) chip.classList.add('active');
        chip.addEventListener('click', () => {
          filterBar.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
          chip.classList.add('active');
          activeCategory = chip.getAttribute('data-category');
          applyFilter();
        });
      });
    }

    applyFilter();
  } catch (err) {
    container.innerHTML = '<div class="alert alert-error">Failed to load products: ' + escapeHtml(err.message) + '</div>';
  }
}

async function applyFilter() {
  const container = document.getElementById('products-list');
  const term = searchTerm.toLowerCase();
  const filtered = allProducts.filter((p) => {
    const matchCategory = !activeCategory || p.category === activeCategory;
    const matchSearch = !term || (p.name || '').toLowerCase().includes(term);
    return matchCategory && matchSearch;
  });
  const countEl = document.getElementById('product-count');
  if (countEl) {
    const label = activeCategory ? activeCategory : 'all products';
    countEl.textContent = filtered.length + ' ' + (filtered.length === 1 ? 'product' : 'products') + ' · ' + label;
  }
  const inCart = await getCartMapForPage();
  renderProducts(container, filtered, inCart);
}


function initSearch() {
  const input = document.getElementById('product-search');
  if (!input) return;
  input.addEventListener('input', () => {
    searchTerm = input.value;
    applyFilter();
  });
}


document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.add-to-cart');
  if (btn) {
    const ok = await addToCart(btn.getAttribute('data-id'), 1);
    if (ok) updateInCartState();
  }
});


document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('featured-products') || document.getElementById('home-categories') || document.getElementById('new-arrivals')) {
    loadHome();
  }
  if (document.getElementById('products-list')) {
    initSearch();
    initProductsPage();
  }
});
