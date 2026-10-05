

document.addEventListener('DOMContentLoaded', async () => {
  const user = await requireAdmin();
  if (!user) return;

  await populateCategoryOptions();

  const form = document.getElementById('add-product-form');
  const submitBtn = document.getElementById('submit-btn');
  const imageInput = document.getElementById('image');
  const preview = document.getElementById('image-preview');

  
  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) {
      preview.innerHTML = 'No image selected';
      return;
    }
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
    if (Number(price) < 0 || Number(stock) < 0) {
      showToast('Price and stock cannot be negative', 'error');
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
      await API.postFormData('/products', formData);
      showToast('Product created successfully');
      window.location.href = 'products.html';
    } catch (err) {
      showToast(err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add product';
    }
  });
});


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
