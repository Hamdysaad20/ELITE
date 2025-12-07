const https = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/sync/products',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-token': 'change-me'
  }
};

const req = https.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);
  console.log(`headers:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response body:');
    console.log(data);
    
    try {
      const parsed = JSON.parse(data);
      console.log('\nParsed JSON:');
      console.log(parsed);
    } catch (e) {
      console.log('\nNot valid JSON, raw response:');
      console.log(data.substring(0, 500) + '...');
    }
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.end();