

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('orders-content');
  if (!container) return;

  const user = await requireAuth();
  if (!user) return;

  await loadOrders(container);
});

async function loadOrders(container) {
  container.innerHTML = '<div class="spinner"></div>';
  try {
    const res = await API.getOrders();
    const orders = res.data || [];

    if (!orders.length) {
      container.innerHTML =
        '<div class="empty-state">' +
        '  <div class="empty-icon">' + icon('box') + '</div>' +
        '  <h3>No orders yet</h3>' +
        '  <p>When you place an order, it will appear here.</p>' +
        '  <a href="products.html" class="btn btn-primary">Start shopping</a>' +
        '</div>';
      return;
    }

    container.innerHTML = '<div class="order-list">' + orders.map(orderCardHtml).join('') + '</div>';
  } catch (err) {
    container.innerHTML = '<div class="alert alert-error">Failed to load orders: ' + escapeHtml(err.message) + '</div>';
  }
}

function orderCardHtml(order) {
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';
  const itemCount = (order.items || []).length;

  return (
    '<a class="order-card" href="order-details.html?id=' + order._id + '">' +
    '  <div class="order-card-top">' +
    '    <span class="order-id">Order #' + escapeHtml(String(order._id).slice(-6).toUpperCase()) + '</span>' +
    '    <span class="order-date">' + date + '</span>' +
    '  </div>' +
    '  <div class="order-card-mid">' +
    '    <span class="order-count">' + itemCount + ' item' + (itemCount === 1 ? '' : 's') + '</span>' +
    '    <span class="order-total">' + formatCurrency(order.total) + '</span>' +
    '  </div>' +
    '  <div class="order-card-bottom">' +
    '    ' + statusBadge(order.paymentStatus) + statusBadge(order.orderStatus) +
    '  </div>' +
    '</a>'
  );
}
