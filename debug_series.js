const axios = require('axios');

const BASE_URL = 'https://www.yupmanga.com';

async function main() {
  const seriesId = process.argv[2] || '1';
  console.log('Fetching series:', seriesId);
  
  const response = await axios.get(`${BASE_URL}/series.php?id=${seriesId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html',
    },
    timeout: 30000,
  });
  
  const fs = require('fs');
  fs.writeFileSync(`debug_series_${seriesId}.html`, response.data);
  console.log('Saved to debug_series_' + seriesId + '.html');
  console.log('Length:', response.data.length);
}

main().catch(console.error);