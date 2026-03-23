const http = require('http');

const data = JSON.stringify({
  cartId: 'test-cart-456',
  items: [
    {
      productId: 'cmn176six000epmamfpfi85fo',
      quantity: 1,
      price: 15000
    }
  ],
  subtotal: 15000,
  total: 15000,
  customerName: "Auditor AI",
  customerEmail: "auditor@ai.com",
  customerPhone: "1122334455",
  shippingMethod: "PICKUP",
  paymentMethod: "CASH"
});

const req = http.request({
  hostname: 'localhost',
  port: 8080,
  path: '/api/orders',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(`[POST 1] Status: ${res.statusCode}\nBody: ${body}`));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();

// Send again to test upsert (same phone)
setTimeout(() => {
  const req2 = http.request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/orders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => console.log(`[POST 2] Status: ${res.statusCode}\nBody: ${body}`));
  });
  req2.write(data);
  req2.end();
}, 2000);
