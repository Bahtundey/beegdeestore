

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAdmin();
  if (!user) return;

  const id = getQueryParam('id');
  if (!id) {
    window.location.href = 'products.html';
    return;
  }

  await populateCategoryOptions();
  await loadProductForEdit(id);

  const form = document.getElementById('edit-product-form');
  const submitBtn = document.getElementById('submit-btn');
  const imageInput = document.getElementById('image');
  const preview = document.getElementById('image-preview');

  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.innerHTML = '<img src="' + e.target.result + '" alt="Preview">';
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const description = document.getElementById('description').value.trim();
    const price = document.getElementById('price').value;
    const category = document.getElementById('category').value.trim();
    const stock = document.getElementById('stock').value;
    const imageFile = imageInput.files[0];

    if (!name || !description || !price || !category || stock === '') {
      showToast('Please fill in all fields', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('category', category);
    formData.append('stock', stock);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';

    try {
      await API.putFormData('/products/' + id, formData);
      showToast('Product updated successfully');
      window.location.href = 'products.html';
    } catch (err) {
      showToast(err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save changes';
    }
  });
});

async function loadProductForEdit(id) {
  const container = document.getElementById('edit-product-form');
  try {
    const res = await API.get('/products/' + id);
    const p = res.data;

    document.getElementById('name').value = p.name || '';
    document.getElementById('description').value = p.description || '';
    document.getElementById('price').value = p.price ?? '';
    document.getElementById('category').value = p.category || '';
    document.getElementById('stock').value = p.stock ?? '';

    const preview = document.getElementById('image-preview');
    if (p.image) {
      preview.innerHTML = '<img src="' + p.image + '" alt="Current image">';
    } else {
      preview.innerHTML = 'No image';
    }
  } catch (err) {
    container.innerHTML = '<div class="alert alert-error">Failed to load product: ' + escapeHtml(err.message) + '</div>';
  }
}

async function populateCategoryOptions() {
  try {
    const res = await API.get('/products');
    const products = res.data || [];
    const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
    const datalist = document.getElementById('category-options');
    if (datalist) {
      datalist.innerHTML = categories
        .map((c) => '<option value="' + escapeHtml(c) + '"></option>')
        .join('');
    }
  } catch (e) {
    
  }
}
