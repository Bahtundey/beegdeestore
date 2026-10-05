

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAdmin();
  if (!user) return;

  await loadAdminOrders();
});

async function loadAdminOrders() {
  const tbody = document.getElementById('orders-table-body');
  tbody.innerHTML = '<tr><td colspan="7"><div class="spinner"></div></td></tr>';

  try {
    const res = await API.getAdminOrders();
    const orders = res.data || [];

    if (!orders.length) {
      tbody.innerHTML =
        '<tr><td colspan="7"><div class="empty-state">' +
        '<div class="empty-icon">' + icon('box') + '</div><h3>No orders yet</h3>' +
        '<p>Orders will appear here after customers check out.</p>' +
        '</div></td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(rowHtml).join('');

    tbody.querySelectorAll('.order-status-select').forEach((sel) => {
      sel.addEventListener('change', () => onStatusChange(sel));
    });
  } catch (err) {
    tbody.innerHTML =
      '<tr><td colspan="7"><div class="alert alert-error">Failed to load orders: ' + escapeHtml(err.message) + '</div></td></tr>';
  }
}

function rowHtml(order) {
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';
  const customer = order.customer || {};
  const statusOptions = ORDER_STATUSES.map(
    (s) => '<option value="' + s + '"' + (s === order.orderStatus ? ' selected' : '') + '>' + s + '</option>'
  ).join('');

  return (
    '<tr>' +
    '  <td class="order-id">#' + escapeHtml(String(order._id).slice(-6).toUpperCase()) + '</td>' +
    '  <td>' + escapeHtml(customer.name || '—') + '<br><span class="text-muted">' + escapeHtml(customer.email || '') + '</span></td>' +
    '  <td>' + formatCurrency(order.total) + '</td>' +
    '  <td>' + statusBadge(order.paymentStatus) + '</td>' +
    '  <td><select class="order-status-select" data-id="' + order._id + '">' + statusOptions + '</select></td>' +
    '  <td>' + date + '</td>' +
    '  <td><a href="order-details.html?id=' + order._id + '" class="btn btn-secondary btn-sm">View</a></td>' +
    '</tr>'
  );
}

async function onStatusChange(select) {
  const id = select.getAttribute('data-id');
  const newStatus = select.value;
  select.disabled = true;
  try {
    await API.updateOrderStatus(id, newStatus);
    showToast('Order status updated to ' + newStatus);
  } catch (err) {
    showToast(err.message, 'error');
  }
  await loadAdminOrders();
}
