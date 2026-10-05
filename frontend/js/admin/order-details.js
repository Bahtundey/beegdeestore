

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAdmin();
  if (!user) return;

  const id = getQueryParam('id');
  const container = document.getElementById('admin-order-details');
  if (!id) {
    container.innerHTML = '<div class="alert alert-error">No order selected.</div>';
    return;
  }
  await loadOrder(container, id);
});

async function loadOrder(container, id) {
  container.innerHTML = '<div class="spinner"></div>';
  try {
    const res = await API.getAdminOrder(id);
    renderOrder(container, res.data);
  } catch (err) {
    container.innerHTML = '<div class="alert alert-error">Failed to load order: ' + escapeHtml(err.message) + '</div>';
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

  const statusOptions = ORDER_STATUSES.map(
    (s) => '<option value="' + s + '"' + (s === order.orderStatus ? ' selected' : '') + '>' + s + '</option>'
  ).join('');

  container.innerHTML =
    '<div class="admin-header"><h1>Order #' + escapeHtml(String(order._id).slice(-6).toUpperCase()) + '</h1>' +
    '<a href="orders.html" class="btn btn-secondary btn-sm">Back to orders</a></div>' +
    '<div class="order-details-layout">' +
    '  <div class="card od-main">' +
    '    <div class="od-header">' +
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
    '    <div class="form-group" style="margin-top:16px">' +
    '      <label for="order-status">Order status</label>' +
    '      <select id="order-status">' + statusOptions + '</select>' +
    '    </div>' +
    '    <p class="hint">Payment status is set by Paystack verification and cannot be edited here.</p>' +
    '  </div>' +
    '</div>';

  document.getElementById('order-status').addEventListener('change', async (e) => {
    e.target.disabled = true;
    try {
      await API.updateOrderStatus(order._id, e.target.value);
      showToast('Order status updated');
      await loadOrder(container, order._id);
    } catch (err) {
      showToast(err.message, 'error');
      e.target.disabled = false;
    }
  });
}
