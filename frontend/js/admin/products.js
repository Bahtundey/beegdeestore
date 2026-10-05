

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAdmin();
  if (!user) return;

  await loadAdminProducts();
});

async function loadAdminProducts() {
  const tableBody = document.getElementById('products-table-body');
  tableBody.innerHTML = '<tr><td colspan="7"><div class="spinner"></div></td></tr>';

  try {
    const res = await API.get('/products');
    const products = res.data || [];

    if (!products.length) {
      tableBody.innerHTML =
        '<tr><td colspan="7"><div class="empty-state">' +
        '<div class="empty-icon">' + icon('box') + '</div><h3>No products yet</h3>' +
        '<p>Add your first product to get started.</p>' +
        '<a href="add-product.html" class="btn btn-primary btn-sm">Add product</a>' +
        '</div></td></tr>';
      return;
    }

    tableBody.innerHTML = products
      .map((p) => {
        const thumb = p.image
          ? '<img src="' + p.image + '" alt="' + escapeHtml(p.name) + '">'
          : escapeHtml((p.name || '?').charAt(0).toUpperCase());
        const created = p.createdAt
          ? new Date(p.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          : '—';
        return (
          '<tr>' +
          '  <td><span class="thumb">' + thumb + '</span></td>' +
          '  <td class="product-name">' + escapeHtml(p.name) + '</td>' +
          '  <td>' + escapeHtml(p.category || '—') + '</td>' +
          '  <td>' + formatPrice(p.price) + '</td>' +
          '  <td>' + p.stock + ' ' + stockBadge(p.stock) + '</td>' +
          '  <td>' + created + '</td>' +
          '  <td><div class="row-actions">' +
          '    <a href="edit-product.html?id=' + p._id + '" class="btn btn-secondary btn-sm">Edit</a>' +
          '    <button class="btn btn-danger btn-sm" data-id="' + p._id + '" data-name="' + escapeHtml(p.name) + '">Delete</button>' +
          '  </div></td>' +
          '</tr>'
        );
      })
      .join('');

    tableBody.querySelectorAll('button[data-id]').forEach((btn) => {
      btn.addEventListener('click', () => onDeleteProduct(btn));
    });
  } catch (err) {
    tableBody.innerHTML =
      '<tr><td colspan="7"><div class="alert alert-error">Failed to load products: ' + escapeHtml(err.message) + '</div></td></tr>';
  }
}

async function onDeleteProduct(btn) {
  const id = btn.getAttribute('data-id');
  const name = btn.getAttribute('data-name');
  if (!window.confirm('Delete "' + name + '" permanently? Its image will also be removed.')) return;

  btn.disabled = true;
  try {
    await API.del('/products/' + id);
    showToast('Product deleted successfully');
    await loadAdminProducts();
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
  }
}
