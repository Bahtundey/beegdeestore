

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

async function loadProductDetails() {
  const container = document.getElementById('product-details');
  const id = getQueryParam('id');

  if (!id) {
    container.innerHTML = '<div class="alert alert-error">No product selected.</div>';
    return;
  }

  container.innerHTML =
    '<div class="product-details">' +
    '  <div class="skeleton" style="aspect-ratio:1/1"></div>' +
    '  <div><div class="skeleton sk-line" style="height:20px;margin-bottom:12px"></div>' +
    '  <div class="skeleton sk-line" style="height:34px;margin-bottom:12px"></div>' +
    '  <div class="skeleton sk-line short" style="height:18px;margin-bottom:12px"></div>' +
    '  <div class="skeleton sk-line" style="height:16px;margin-bottom:8px"></div>' +
    '  <div class="skeleton sk-line" style="height:16px;margin-bottom:8px"></div>' +
    '  <div class="skeleton sk-line short" style="height:16px"></div></div>' +
    '</div>';

  try {
    const res = await API.get('/products/' + id);
    const p = res.data;

    const imageHtml = p.image
      ? '<img src="' + p.image + '" alt="' + escapeHtml(p.name) + '">'
      : '<span class="placeholder">' + escapeHtml((p.name || '?').charAt(0).toUpperCase()) + '</span>';

    const stockHtml = stockBadge(p.stock);

    const actionsHtml =
      p.stock <= 0
        ? '<button class="btn btn-secondary" disabled>Out of stock</button>'
        : '<div class="qty-control">' +
          '  <button type="button" class="qty-btn" id="qty-minus" aria-label="Decrease quantity">' + icon('minus') + '</button>' +
          '  <span class="qty-value" id="qty-value">1</span>' +
          '  <button type="button" class="qty-btn" id="qty-plus" aria-label="Increase quantity">' + icon('plus') + '</button>' +
          '</div>' +
          '<button type="button" class="btn btn-primary" id="add-to-cart-btn">' + icon('cart') + ' Add to cart</button>';

    container.innerHTML =
      '<nav class="breadcrumb"><a href="products.html">Shop</a>' +
      (p.category ? '<span> / </span><a href="products.html?category=' + encodeURIComponent(p.category) + '">' + escapeHtml(p.category) + '</a>' : '') +
      '</nav>' +
      '<div class="product-details">' +
      '  <div class="details-image">' + imageHtml + '</div>' +
      '  <div class="details-info">' +
      '    <span class="details-category">' + escapeHtml(p.category || 'Uncategorised') + '</span>' +
      '    <h1>' + escapeHtml(p.name) + '</h1>' +
      '    <div class="details-price">' + formatPrice(p.price) + '</div>' +
      '    <div class="details-stock">' + stockHtml + '</div>' +
      '    <p class="details-description">' + escapeHtml(p.description || 'No description provided.') + '</p>' +
      '    <div class="details-actions">' + actionsHtml + '</div>' +
      '    <div class="details-meta">' +
      '      <div class="meta-row"><span>' + icon('shield') + ' Secure checkout</span>' +
      '      <span>' + icon('truck') + ' Fast delivery</span></div>' +
      '    </div>' +
      '  </div>' +
      '</div>';

    
    if (p.stock > 0) {
      let qty = 1;
      const qtyValue = document.getElementById('qty-value');
      const minus = document.getElementById('qty-minus');
      const plus = document.getElementById('qty-plus');
      const addBtn = document.getElementById('add-to-cart-btn');

      minus.addEventListener('click', () => {
        if (qty > 1) { qty--; qtyValue.textContent = qty; }
      });
      plus.addEventListener('click', () => {
        if (qty < p.stock) { qty++; qtyValue.textContent = qty; }
      });
      addBtn.addEventListener('click', async () => {
        const ok = await addToCart(id, qty);
        if (ok) {
          // Success state on the button, then restore.
          addBtn.classList.add('btn-success');
          addBtn.innerHTML = icon('check') + ' Added to cart';
          setTimeout(() => {
            addBtn.classList.remove('btn-success');
            addBtn.innerHTML = icon('cart') + ' Add to cart';
          }, 1600);
        }
      });
    }
  } catch (err) {
    container.innerHTML =
      '<div class="empty-state">' +
      '  <div class="empty-icon">' + icon('box') + '</div>' +
      '  <h3>Product not found</h3>' +
      '  <p>' + escapeHtml(err.message) + '</p>' +
      '  <a href="products.html" class="btn btn-primary">Browse products</a>' +
      '</div>';
  }
}

document.addEventListener('DOMContentLoaded', loadProductDetails);
