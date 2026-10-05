

let currentCart = null;

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('cart-content');
  if (!container) return;

  const user = await requireAuth();
  if (!user) return; 

  await loadCart(container);
});

async function loadCart(container) {
  container.innerHTML = '<div class="spinner"></div>';
  try {
    const res = await API.get('/carts');
    currentCart = res.data;
    renderCart(container);
    
    invalidateCartCache();
    updateCartBadge();
  } catch (err) {
    container.innerHTML = '<div class="alert alert-error">Failed to load cart: ' + escapeHtml(err.message) + '</div>';
  }
}

function renderCart(container) {
  const items = currentCart.items || [];

  if (!items.length) {
    container.innerHTML =
      '<div class="empty-state">' +
      '  <div class="empty-icon">' + icon('cart') + '</div>' +
      '  <h3>Your cart is waiting</h3>' +
      '  <p>Discover something you\u2019ll love and it will appear here.</p>' +
      '  <a href="products.html" class="btn btn-primary">Continue shopping</a>' +
      '</div>';
    return;
  }

  const itemsHtml = items
    .map((item) => {
      const p = item.product;
      const img = p.image
        ? '<img src="' + p.image + '" alt="' + escapeHtml(p.name) + '">'
        : escapeHtml((p.name || '?').charAt(0).toUpperCase());
      return (
        '<div class="cart-item" data-id="' + p._id + '">' +
        '  <div class="item-image">' + img + '</div>' +
        '  <div class="item-info">' +
        '    <div class="item-name"><a href="product-details.html?id=' + p._id + '">' + escapeHtml(p.name) + '</a></div>' +
        '    <div class="item-price">' + formatPrice(p.price) + ' each</div>' +
        '  </div>' +
        '  <div class="qty-control">' +
        '    <button type="button" class="qty-btn qty-minus" aria-label="Decrease quantity">' + icon('minus') + '</button>' +
        '    <span class="qty-value">' + item.quantity + '</span>' +
        '    <button type="button" class="qty-btn qty-plus" aria-label="Increase quantity">' + icon('plus') + '</button>' +
        '  </div>' +
        '  <div class="item-subtotal">' + formatPrice(item.subtotal) + '</div>' +
        '  <button type="button" class="remove-item">' + icon('trash') + ' Remove</button>' +
        '</div>'
      );
    })
    .join('');

  container.innerHTML =
    '<div class="cart-layout">' +
    '  <div class="cart-items">' + itemsHtml + '</div>' +
    '  <div class="cart-summary">' +
    '    <h3>Order summary</h3>' +
    '    <div class="summary-row"><span>Subtotal</span><span>' + formatPrice(currentCart.total) + '</span></div>' +
    '    <div class="summary-row total"><span>Total</span><span>' + formatPrice(currentCart.total) + '</span></div>' +
    '    <a href="checkout.html" class="btn btn-primary btn-block">' + icon('card') + ' Proceed to checkout</a>' +
    '    <a href="products.html" class="btn btn-secondary btn-block" style="margin-top:8px">Continue shopping</a>' +
    '    <p class="summary-note">Taxes and shipping calculated at checkout.</p>' +
    '  </div>' +
    '</div>';

  container.querySelectorAll('.cart-item').forEach((el) => {
    const id = el.getAttribute('data-id');
    const item = items.find((i) => i.product._id === id);
    el.querySelector('.qty-minus').addEventListener('click', () => changeQuantity(container, id, item.quantity - 1));
    el.querySelector('.qty-plus').addEventListener('click', () => changeQuantity(container, id, item.quantity + 1));
    el.querySelector('.remove-item').addEventListener('click', () => changeQuantity(container, id, 0));
  });
}

function itemsPayload() {
  return (currentCart.items || []).map((i) => ({ product: i.product._id, quantity: i.quantity }));
}

async function changeQuantity(container, productId, newQty) {
  const items = itemsPayload();
  if (newQty <= 0) {
    await submitItems(container, items.filter((i) => i.product !== productId));
  } else {
    const idx = items.findIndex((i) => i.product === productId);
    if (idx === -1) return;
    items[idx].quantity = newQty;
    await submitItems(container, items);
  }
}

async function submitItems(container, items) {
  try {
    await API.put('/carts/' + currentCart._id, { items });
    if (!items.length) showToast('Cart cleared');
  } catch (err) {
    showToast(err.message, 'error');
  }
  await loadCart(container);
}
