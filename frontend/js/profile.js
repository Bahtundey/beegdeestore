

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('profile-content');
  if (!container) return;

  container.innerHTML = '<div class="spinner"></div>';

  const user = await requireAuth();
  if (!user) return; 

  renderProfile(container, user);
});

function renderProfile(container, user) {
  const roleBadge =
    user.role === 'admin'
      ? '<span class="badge badge-ok">' + icon('shield') + ' Admin</span>'
      : '<span class="badge badge-low">Customer</span>';

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  container.innerHTML =
    '<div class="card profile-card">' +
    '  <div class="profile-avatar">' + escapeHtml((user.name || '?').charAt(0).toUpperCase()) + '</div>' +
    '  <h1>' + escapeHtml(user.name) + '</h1>' +
    '  <p class="text-muted">' + roleBadge + '</p>' +

    '  <form id="profile-form" class="profile-form" novalidate>' +
    '    <div class="form-group">' +
    '      <label for="pf-name">Name</label>' +
    '      <input type="text" id="pf-name" value="' + escapeHtml(user.name) + '" required>' +
    '    </div>' +
    '    <div class="form-group">' +
    '      <label for="pf-email">Email</label>' +
    '      <input type="email" id="pf-email" value="' + escapeHtml(user.email) + '" required>' +
    '    </div>' +
    '    <div class="form-group">' +
    '      <label for="pf-password">New password (optional)</label>' +
    '      <input type="password" id="pf-password" placeholder="Leave blank to keep your current password" autocomplete="new-password">' +
    '    </div>' +
    '    <button type="submit" class="btn btn-primary btn-block">Save changes</button>' +
    '  </form>' +

    '  <div class="profile-fields">' +
    '    <div class="profile-field"><span class="field-label">Member since</span><span class="field-value">' + memberSince + '</span></div>' +
    '    <div class="profile-field"><span class="field-label">Account role</span><span class="field-value">' + escapeHtml(user.role) + '</span></div>' +
    '  </div>' +

    '  <div class="profile-actions">' +
    '    <a href="orders.html" class="btn btn-secondary">' + icon('box') + ' My orders</a>' +
    '    <a href="products.html" class="btn btn-secondary">' + icon('arrow') + ' Browse products</a>' +
    '    <button class="btn btn-secondary" id="logout-btn">' + icon('logout') + ' Log out</button>' +
    '  </div>' +
    '  <div class="profile-actions" style="margin-top:10px">' +
    '    <button class="btn btn-danger btn-sm" id="delete-account-btn">' + icon('trash') + ' Delete my account</button>' +
    '  </div>' +
    '</div>';

  document.getElementById('logout-btn').addEventListener('click', logout);

  document.getElementById('delete-account-btn').addEventListener('click', async () => {
    if (!window.confirm('Delete your account permanently? This cannot be undone.')) return;
    try {
      await API.del('/users/' + user._id);
      clearSession();
      window.location.href = 'index.html';
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('pf-name').value.trim();
    const email = document.getElementById('pf-email').value.trim();
    const password = document.getElementById('pf-password').value;

    if (!name || !email) {
      showToast('Name and email are required', 'error');
      return;
    }

    const payload = { name, email };
    if (password) payload.password = password;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';

    try {
      const res = await API.put('/users/' + user._id, payload);
      
      localStorage.setItem('user', JSON.stringify(res.data));
      showToast('Profile updated');
      renderProfile(container, res.data);
    } catch (err) {
      showToast(err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save changes';
    }
  });
}
