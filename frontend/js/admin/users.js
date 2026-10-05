

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAdmin();
  if (!user) return;

  await loadUsers();
});

async function loadUsers() {
  const tbody = document.getElementById('users-table-body');
  tbody.innerHTML = '<tr><td colspan="4"><div class="spinner"></div></td></tr>';

  try {
    const res = await API.get('/users');
    const users = res.data || [];

    if (!users.length) {
      tbody.innerHTML =
        '<tr><td colspan="4"><div class="empty-state">' +
        '<div class="empty-icon">' + icon('users') + '</div><h3>No users found</h3>' +
        '<p>New registrations will appear here.</p>' +
        '</div></td></tr>';
      return;
    }

    tbody.innerHTML = users.map(rowHtml).join('');

    tbody.querySelectorAll('.role-select').forEach((sel) => {
      sel.addEventListener('change', () => onRoleChange(sel));
    });
  } catch (err) {
    tbody.innerHTML =
      '<tr><td colspan="4"><div class="alert alert-error">Failed to load users: ' + escapeHtml(err.message) + '</div></td></tr>';
  }
}

function rowHtml(u) {
  const created = u.createdAt
    ? new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';
  const roleOptions = ['user', 'admin']
    .map((r) => '<option value="' + r + '"' + (r === u.role ? ' selected' : '') + '>' + r + '</option>')
    .join('');

  return (
    '<tr>' +
    '  <td class="product-name">' + escapeHtml(u.name) + '</td>' +
    '  <td>' + escapeHtml(u.email) + '</td>' +
    '  <td><select class="role-select" data-id="' + u._id + '">' + roleOptions + '</select></td>' +
    '  <td>' + created + '</td>' +
    '</tr>'
  );
}

async function onRoleChange(select) {
  const id = select.getAttribute('data-id');
  const role = select.value;
  select.disabled = true;
  try {
    await API.put('/users/' + id, { role });
    showToast('Role updated to ' + role);
  } catch (err) {
    showToast(err.message, 'error');
  }
  await loadUsers();
}
