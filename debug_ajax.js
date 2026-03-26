const axios = require('axios');

const BASE_URL = 'https://www.yupmanga.com';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  },
});

async function getSeriesWithCookies(seriesId) {
  console.log('\n=== Step 1: Get main page to obtain cookies ===');
  const mainResp = await client.get(`/series.php?id=${seriesId}`);
  console.log('Main page status:', mainResp.status);
  console.log('Cookies:', client.defaults.headers.Cookie);
  
  console.log('\n=== Step 2: Try AJAX endpoint ===');
  try {
    const ajaxResp = await client.get(`/ajax/chapters.php`, {
      params: { series_id: seriesId },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    console.log('AJAX status:', ajaxResp.status);
    console.log('AJAX data length:', ajaxResp.data.length);
    console.log('AJAX data preview:', ajaxResp.data.substring(0, 500));
  } catch (e) {
    console.log('AJAX error:', e.message);
  }
  
  console.log('\n=== Step 3: Try loadMore with POST ===');
  try {
    const postResp = await client.post(`/ajax/load_chapters.php`, 
      `series_id=${seriesId}&page=1&order=oldest_first`,
      {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
        },
      }
    );
    console.log('POST status:', postResp.status);
    console.log('POST data:', postResp.data.substring(0, 500));
  } catch (e) {
    console.log('POST error:', e.message);
  }
}

getSeriesWithCookies('ECKMWO1IOTQQ9').catch(console.error);