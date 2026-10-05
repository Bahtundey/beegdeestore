

let currentCart = null;

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('checkout-content');
  if (!container) return;

  const user = await requireAuth();
  if (!user) return; 

  await loadCheckout(container, user);
});

async function loadCheckout(container, user) {
  container.innerHTML = '<div class="spinner"></div>';
  try {
    const res = await API.get('/carts');
    currentCart = res.data;
    renderCheckout(container, user);
  } catch (err) {
    container.innerHTML = '<div class="alert alert-error">Failed to load your cart: ' + escapeHtml(err.message) + '</div>';
  }
}

function renderCheckout(container, user) {
  const items = currentCart.items || [];

  if (!items.length) {
    container.innerHTML =
      '<div class="empty-state">' +
      '  <div class="empty-icon">' + icon('cart') + '</div>' +
      '  <h3>Your cart is empty</h3>' +
      '  <p>Add items to your cart before checking out.</p>' +
      '  <a href="products.html" class="btn btn-primary">Browse products</a>' +
      '</div>';
    return;
  }

  const itemsHtml = items.map((item) => {
    const p = item.product;
    const img = p.image
      ? '<img src="' + p.image + '" alt="' + escapeHtml(p.name) + '">'
      : escapeHtml((p.name || '?').charAt(0).toUpperCase());
    return (
      '<div class="co-item">' +
      '  <div class="co-item-image">' + img + '</div>' +
      '  <div class="co-item-info">' +
      '    <div class="co-item-name">' + escapeHtml(p.name) + '</div>' +
      '    <div class="co-item-meta">' + formatCurrency(p.price) + ' × ' + item.quantity + '</div>' +
      '  </div>' +
      '  <div class="co-item-subtotal">' + formatCurrency(item.subtotal) + '</div>' +
      '</div>'
    );
  }).join('');

  container.innerHTML =
    '<div class="checkout-layout">' +
    '  <form class="checkout-form" id="checkout-form" novalidate>' +
    '    <h2>Customer information</h2>' +
    '    <div class="form-group">' +
    '      <label for="co-name">Full name</label>' +
    '      <input type="text" id="co-name" value="' + escapeHtml(user.name) + '" required>' +
    '    </div>' +
    '    <div class="form-group">' +
    '      <label for="co-email">Email</label>' +
    '      <input type="email" id="co-email" value="' + escapeHtml(user.email) + '" required>' +
    '    </div>' +
    '    <p class="secure-note">' + icon('shield') + ' You will be redirected to Paystack to complete your payment securely.</p>' +
    '    <button type="submit" id="pay-btn" class="btn btn-primary btn-block">' + icon('card') + ' Pay ' + formatCurrency(currentCart.total) + ' now</button>' +
    '  </form>' +
    '  <div class="checkout-summary">' +
    '    <h3>Order summary</h3>' +
    '    <div class="co-items">' + itemsHtml + '</div>' +
    '    <div class="summary-row"><span>Subtotal</span><span>' + formatCurrency(currentCart.total) + '</span></div>' +
    '    <div class="summary-row total"><span>Total</span><span>' + formatCurrency(currentCart.total) + '</span></div>' +
    '    <a href="cart.html" class="btn btn-secondary btn-block" style="margin-top:10px">Edit cart</a>' +
    '  </div>' +
    '</div>';

  document.getElementById('checkout-form').addEventListener('submit', onPayNow);
}

async function onPayNow(e) {
  e.preventDefault();
  const email = document.getElementById('co-email').value.trim();
  const btn = document.getElementById('pay-btn');

  if (!/.+@.+\..+/.test(email)) {
    showToast('Please enter a valid email address', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Preparing secure payment…';

  try {
    const res = await API.initializePayment({ email });
    const authorizationUrl = res.data && res.data.authorizationUrl;
    if (!authorizationUrl) {
      throw new Error('No payment URL returned');
    }
    
    window.location.href = authorizationUrl;
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Pay ' + formatCurrency(currentCart.total) + ' now';
  }
}
