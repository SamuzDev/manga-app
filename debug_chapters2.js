const axios = require('axios');

const BASE_URL = 'https://www.yupmanga.com';

async function testEndpoints() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9',
    'Referer': 'https://www.yupmanga.com/',
  };
  
  const client = axios.create({ baseURL: BASE_URL, headers, timeout: 30000 });
  
  console.log('=== Get main page ===');
  const main = await client.get('/');
  console.log('Main status:', main.status);
  const cookies = main.headers['set-cookie'];
  console.log('Cookies:', cookies?.slice(0, 2));
  
  if (cookies) {
    const cookieStr = cookies.map(c => c.split(';')[0]).join('; ');
    client.defaults.headers['Cookie'] = cookieStr;
  }
  
  console.log('\n=== Try series page with cookies ===');
  try {
    const series = await client.get('/series.php?id=ECKMWO1IOTQQ9');
    console.log('Series status:', series.status);
    console.log('Has chapters-grid with content:', series.data.includes('chapters-skeleton') ? 'skeleton only' : 'has content');
  } catch (e) {
    console.log('Error:', e.message);
  }
  
  console.log('\n=== Try various AJAX endpoints ===');
  const endpoints = [
    '/ajax/load_chapters.php?series=ECKMWO1IOTQQ9',
    '/ajax/load_chapters.php?series_id=ECKMWO1IOTQQ9', 
    '/ajax/get_chapters.php?series=ECKMWO1IOTQQ9',
    '/ajax/chapters?series=ECKMWO1IOTQQ9',
    '/api/chapters/ECKMWO1IOTQQ9',
    '/series/ECKMWO1IOTQQ9/chapters',
    '/ajax/series_chapters.php?series_id=ECKMWO1IOTQQ9',
  ];
  
  for (const endpoint of endpoints) {
    try {
      const resp = await client.get(endpoint, { 
        headers: { 'X-Requested-With': 'XMLHttpRequest', 'Referer': `${BASE_URL}/series.php?id=ECKMWO1IOTQQ9` }
      });
      console.log(`${endpoint}: ${resp.status}, length=${resp.data.length}`);
    } catch (e) {
      console.log(`${endpoint}: ${e.message}`);
    }
  }
  
  console.log('\n=== Try POST to load_chapters ===');
  try {
    const postResp = await client.post('/ajax/load_chapters.php', 
      'series=ECKMWO1IOTQQ9&page=1&order=oldest_first',
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' }}
    );
    console.log('POST status:', postResp.status);
    console.log('Data preview:', postResp.data.substring(0, 300));
  } catch (e) {
    console.log('POST error:', e.message);
  }
}

testEndpoints().catch(console.error);