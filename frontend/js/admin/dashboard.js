
document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAdmin();
  if (!user) return;

  await loadStats();
  await loadLowStock();
  await loadRecentOrders();
});

async function loadStats() {
  const statsEl = document.getElementById('stats-grid');
  statsEl.innerHTML = '<div class="spinner"></div>';

  try {
    const res = await API.getAdminDashboard();
    const s = res.data;

    statsEl.innerHTML =
      statCard('card', 'Revenue', formatCurrency(s.revenue)) +
      statCard('box', 'Orders', s.orders) +
      statCard('tag', 'Products', s.products) +
      statCard('users', 'Customers', s.users) +
      statCard('check', 'Paid orders', s.paidOrders) +
      statCard('clock', 'Pending orders', s.pendingOrders);
  } catch (err) {
    statsEl.innerHTML = '<div class="alert alert-error">Failed to load statistics: ' + escapeHtml(err.message) + '</div>';
  }
}

function statCard(iconName, label, value) {
  return (
    '<div class="stat-card">' +
    '  <div class="stat-top"><span class="stat-label">' + label + '</span><span class="stat-icon">' + icon(iconName) + '</span></div>' +
    '  <div class="stat-value">' + value + '</div>' +
    '</div>'
  );
}

async function loadLowStock() {
  const el = document.getElementById('low-stock');
  if (!el) return;
  try {
    const res = await API.get('/products');
    const low = (res.data || [])
      .filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);

    if (!low.length) {
      el.innerHTML = '<p class="text-muted">No low-stock products.</p>';
      return;
    }
    el.innerHTML =
      '<div class="dash-list">' +
      low
        .map(
          (p) =>
            '<div class="dash-row"><span class="dash-main">' + escapeHtml(p.name) + '</span>' +
            '<span>' + stockBadge(p.stock) + '</span></div>'
        )
        .join('') +
      '</div>';
  } catch (err) {
    el.innerHTML = '<p class="text-muted">Could not load products.</p>';
  }
}

async function loadRecentOrders() {
  const el = document.getElementById('recent-orders');
  if (!el) return;
  try {
    const res = await API.getAdminOrders();
    const orders = (res.data || []).slice(0, 5);

    if (!orders.length) {
      el.innerHTML = '<p class="text-muted">No orders yet.</p>';
      return;
    }
    el.innerHTML =
      '<div class="dash-list">' +
      orders
        .map(
          (o) =>
            '<div class="dash-row"><span class="dash-main">#' + escapeHtml(String(o._id).slice(-6).toUpperCase()) +
            '<span class="dash-sub"> · ' + formatCurrency(o.total) + '</span></span>' +
            '<span>' + statusBadge(o.orderStatus) + '</span></div>'
        )
        .join('') +
      '</div>';
  } catch (err) {
    el.innerHTML = '<p class="text-muted">Could not load orders.</p>';
  }
}
