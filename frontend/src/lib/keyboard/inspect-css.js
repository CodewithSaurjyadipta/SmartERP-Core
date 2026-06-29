const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  console.log('Inspecting live HTML from https://smarterpdev.vercel.app/ ...');
  const html = await fetchUrl('https://smarterpdev.vercel.app/login');
  
  // Extract CSS stylesheet URL
  const cssMatch = html.match(/href="(\/_next\/static\/chunks\/[^"]+\.css)"/);
  if (!cssMatch) {
    console.log('Could not find CSS stylesheet URL in HTML!');
    return;
  }
  
  const cssUrl = 'https://smarterpdev.vercel.app' + cssMatch[1];
  console.log('Found CSS stylesheet URL:', cssUrl);
  
  const cssContent = await fetchUrl(cssUrl);
  
  console.log('Checking CSS content elements...');
  const hasSatisfy = cssContent.includes('fonts.googleapis.com/css2?family=Satisfy');
  const hasFontLogo = cssContent.includes('font-logo');
  const hasFontSans = cssContent.includes('Inter');
  
  console.log('Results:');
  console.log('- Contains Satisfy Google Font import:', hasSatisfy);
  console.log('- Contains .font-logo class styling definition:', hasFontLogo);
  console.log('- Contains Inter sans-serif style:', hasFontSans);
  
  if (hasFontLogo) {
    // Extract a snippet around the font-logo definition
    const idx = cssContent.indexOf('font-logo');
    console.log('Snippet around .font-logo:\n', cssContent.substring(Math.max(0, idx - 100), Math.min(cssContent.length, idx + 200)));
  }
}

run().catch(console.error);
