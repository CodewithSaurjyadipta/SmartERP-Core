const https = require('https');

https.get('https://smarterpdev.vercel.app/fonts/Runethia.otf', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let size = 0;
  res.on('data', (chunk) => {
    size += chunk.length;
  });
  
  res.on('end', () => {
    console.log('Total content size downloaded:', size, 'bytes');
  });
}).on('error', console.error);
