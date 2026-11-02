import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testNeonRealtime() {
  const url = process.env.NEON_REALTIME_URL;
  const secret = process.env.NEON_REALTIME_SECRET;

  console.log(`Testing Neon Realtime endpoint: ${url}...`);

  try {
    const res = await fetch(url + (url?.endsWith('/') ? '' : '/') + 'health', {
      headers: {
        'Authorization': `Bearer ${secret}`,
      },
    });
    console.log(`✅ Neon Realtime status: ${res.status} ${res.statusText}`);
  } catch (err: any) {
    console.log(`Neon Realtime response check:`, err.message);
  }
}

testNeonRealtime();

