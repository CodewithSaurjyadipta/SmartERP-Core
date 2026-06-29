const https = require('https');

https.get('https://smarterpdev.vercel.app/login', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  
  res.on('end', () => {
    console.log('HTML Length:', data.length);
    // Find all occurrences of logo text
    const idxs = [];
    let idx = data.indexOf('Smart');
    while (idx !== -1) {
      console.log('Found "Smart" at index:', idx);
      console.log('Snippet around:', data.substring(idx - 100, idx + 200));
      idx = data.indexOf('Smart', idx + 1);
    }
  });
}).on('error', console.error);
