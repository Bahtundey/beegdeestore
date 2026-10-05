

const PAYSTACK_SECRET = (process.env.PAYSTACK_SECRET_KEY || '').trim();
const PAYSTACK_BASE = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';

async function paystackRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(PAYSTACK_BASE + path, {
      ...options,
      headers: {
        Authorization: 'Bearer ' + PAYSTACK_SECRET,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  } catch (err) {
   
    return { status: false, message: 'Could not reach the payment provider. Please try again.' };
  }

  let body;
  try {
    body = await response.json();
  } catch (err) {
    body = { status: false, message: 'Unexpected response from the payment provider.' };
  }
  return body; 
}


async function initializePayment({ email, amount, currency, callbackUrl }) {
  return paystackRequest('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email,
      amount,
      currency,
      callback_url: callbackUrl,
    }),
  });
}


async function verifyPayment(reference) {
  return paystackRequest('/transaction/verify/' + encodeURIComponent(reference), {
    method: 'GET',
  });
}

module.exports = { initializePayment, verifyPayment };
