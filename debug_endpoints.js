const axios = require('axios');

const BASE_URL = 'https://www.yupmanga.com';

async function tryChaptersEndpoint(seriesId) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'X-Requested-With': 'XMLHttpRequest',
  };
  
  console.log('\n--- Trying /series/{id}/chapters ---');
  try {
    const r1 = await axios.get(`${BASE_URL}/series/${seriesId}/chapters`, { headers, timeout: 30000 });
    console.log('Status:', r1.status, 'Length:', r1.data.length);
  } catch (e) {
    console.log('Error:', e.message);
  }
  
  console.log('\n--- Trying /ajax/chapters.php ---');
  try {
    const r2 = await axios.get(`${BASE_URL}/ajax/chapters.php?series=${seriesId}`, { headers, timeout: 30000 });
    console.log('Status:', r2.status);
    console.log('Data:', r2.data.substring(0, 500));
  } catch (e) {
    console.log('Error:', e.message);
  }
  
  console.log('\n--- Trying /ajax/get_chapters.php ---');
  try {
    const r3 = await axios.get(`${BASE_URL}/ajax/get_chapters.php?series_id=${seriesId}`, { headers, timeout: 30000 });
    console.log('Status:', r3.status);
    console.log('Data:', r3.data.substring(0, 500));
  } catch (e) {
    console.log('Error:', e.message);
  }
  
  console.log('\n--- Trying /ajax/series_chapters.php ---');
  try {
    const r4 = await axios.get(`${BASE_URL}/ajax/series_chapters.php?id=${seriesId}`, { headers, timeout: 30000 });
    console.log('Status:', r4.status);
    console.log('Data:', r4.data.substring(0, 500));
  } catch (e) {
    console.log('Error:', e.message);
  }
}

const seriesId = process.argv[2] || 'ECKMWO1IOTQQ9';
tryChaptersEndpoint(seriesId).catch(console.error);