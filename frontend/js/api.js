
const API_BASE_URL = 'https://beegdeestore.onrender.com';



function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function removeToken() {
  localStorage.removeItem('token');
}


function getAuthHeaders() {
  const headers = {};
  const token = getToken();
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  return headers;
}


async function apiRequest(path, options = {}) {
  const config = { ...options };

  
  const headers = { ...getAuthHeaders() };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.headers) {
    Object.assign(headers, options.headers);
  }
  config.headers = headers;

  const response = await fetch(API_BASE_URL + path, config);

  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    const message = (data && data.message) || 'Request failed (status ' + response.status + ')';

    
    if (response.status === 401 && getToken()) {
      removeToken();
      localStorage.removeItem('user');
      if (!window.location.pathname.endsWith('/login.html')) {
        const base = window.location.pathname.includes('/admin/') ? '../' : '';
        window.location.href = base + 'login.html';
      }
    }

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}



const API = {
  get: (path) => apiRequest(path, { method: 'GET' }),
  post: (path, body) => apiRequest(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path) => apiRequest(path, { method: 'DELETE' }),
  
  postFormData: (path, formData) => apiRequest(path, { method: 'POST', body: formData }),
  putFormData: (path, formData) => apiRequest(path, { method: 'PUT', body: formData }),

  
  initializePayment: (body) => apiRequest('/payments/initialize', { method: 'POST', body: JSON.stringify(body) }),
  verifyPayment: (reference) => apiRequest('/payments/verify/' + reference, { method: 'GET' }),


  getOrders: () => apiRequest('/orders', { method: 'GET' }),
  getOrder: (id) => apiRequest('/orders/' + id, { method: 'GET' }),

  
  getAdminOrders: () => apiRequest('/admin/orders', { method: 'GET' }),
  getAdminOrder: (id) => apiRequest('/admin/orders/' + id, { method: 'GET' }),
  updateOrderStatus: (id, orderStatus) =>
    apiRequest('/admin/orders/' + id, { method: 'PUT', body: JSON.stringify({ orderStatus }) }),
  getAdminDashboard: () => apiRequest('/admin/dashboard', { method: 'GET' }),
};
