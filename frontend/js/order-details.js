

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('order-details');
  if (!container) return;

  const user = await requireAuth();
  if (!user) return;

  const id = getQueryParam('id');
  if (!id) {
    container.innerHTML = '<div class="alert alert-error">No order selected.</div>';
    return;
  }

  await loadOrder(container, id);
});

async function loadOrder(container, id) {
  container.innerHTML = '<div class="spinner"></div>';
  try {
    const res = await API.getOrder(id);
    renderOrder(container, res.data);
  } catch (err) {
    container.innerHTML =
      '<div class="empty-state">' +
      '  <div class="empty-icon">' + icon('box') + '</div>' +
      '  <h3>Order not found</h3>' +
      '  <p>' + escapeHtml(err.message) + '</p>' +
      '  <a href="orders.html" class="btn btn-primary">Back to orders</a>' +
      '</div>';
  }
}

function renderOrder(container, order) {
  const items = order.items || [];
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  const itemsHtml = items.map((item) => {
    const img = item.image
      ? '<img src="' + item.image + '" alt="' + escapeHtml(item.name) + '">'
      : escapeHtml((item.name || '?').charAt(0).toUpperCase());
    return (
      '<div class="od-item">' +
      '  <div class="od-item-image">' + img + '</div>' +
      '  <div class="od-item-info">' +
      '    <div class="od-item-name">' + escapeHtml(item.name) + '</div>' +
      '    <div class="od-item-meta">' + formatCurrency(item.price) + ' × ' + item.quantity + '</div>' +
      '  </div>' +
      '  <div class="od-item-subtotal">' + formatCurrency(item.price * item.quantity) + '</div>' +
      '</div>'
    );
  }).join('');

  container.innerHTML =
    '<div class="order-details-layout">' +
    '  <div class="card od-main">' +
    '    <div class="od-header">' +
    '      <h1>Order #' + escapeHtml(String(order._id).slice(-6).toUpperCase()) + '</h1>' +
    '      <div class="od-statuses">' + statusBadge(order.paymentStatus) + statusBadge(order.orderStatus) + '</div>' +
    '    </div>' +
    '    <p class="text-muted">Placed on ' + date + '</p>' +
    '    <div class="od-items">' + itemsHtml + '</div>' +
    '    <div class="od-totals">' +
    '      <div class="summary-row"><span>Subtotal</span><span>' + formatCurrency(order.subtotal) + '</span></div>' +
    '      <div class="summary-row total"><span>Total</span><span>' + formatCurrency(order.total) + '</span></div>' +
    '    </div>' +
    '  </div>' +
    '  <div class="card od-side">' +
    '    <h3>Customer</h3>' +
    '    <p class="od-customer-name">' + escapeHtml((order.customer && order.customer.name) || '—') + '</p>' +
    '    <p class="text-muted">' + escapeHtml((order.customer && order.customer.email) || '—') + '</p>' +
    '    <a href="orders.html" class="btn btn-secondary btn-block" style="margin-top:16px">Back to orders</a>' +
    '  </div>' +
    '</div>';
}
