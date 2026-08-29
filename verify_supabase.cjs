const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
if (!VERCEL_TOKEN) {
  console.log('No VERCEL_TOKEN env var set. Will try to set via Vercel API with a hardcoded token if available.');
}

// We can use the Vercel API to set environment variables
// First, let's figure out the project ID from Vercel API

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  // Just verify the Supabase tables exist via REST API
  const supabaseUrl = 'cnwkuzihcmtenpoliqpn.supabase.co';
  const anonKey = 'sb_publishable_9IzznKtQlwTpwG3CMLVLEA_kIROxwDF';
  
  const tables = ['applications', 'members', 'announcements', 'universities', 'cpd_courses', 'elections', 'audit_logs'];
  
  console.log('Checking all tables exist...\n');
  
  for (const table of tables) {
    try {
      const result = await makeRequest({
        hostname: supabaseUrl,
        path: `/rest/v1/${table}?limit=1`,
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        }
      });
      
      const ok = result.status === 200;
      console.log(`${ok ? '✓' : '✗'} Table "${table}": status ${result.status}`);
      if (!ok) {
        console.log('  Error:', JSON.stringify(result.body));
      }
    } catch (err) {
      console.log(`✗ Table "${table}": ${err.message}`);
    }
  }
  
  // Now try inserting a test application  
  console.log('\nTesting INSERT into applications table...');
  const testApp = {
    id: 'TEST-' + Date.now(),
    application_number: 'EPA-TEST-' + Date.now(),
    membership_type: 'STUDENT',
    status: 'SUBMITTED',
    first_name: 'Test',
    father_name: 'User',
    email: 'test@test.com',
    phone: '0911000000',
    city: 'Addis Ababa',
    gender: 'M'
  };
  
  const body = JSON.stringify(testApp);
  try {
    const result = await makeRequest({
      hostname: supabaseUrl,
      path: '/rest/v1/applications',
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
        'Content-Length': Buffer.byteLength(body)
      }
    }, body);
    
    console.log(`INSERT status: ${result.status}`);
    if (result.status === 201 || result.status === 200) {
      console.log('✓ INSERT SUCCESSFUL! Supabase is working correctly.');
    } else {
      console.log('Insert response:', JSON.stringify(result.body));
    }
  } catch (err) {
    console.log('Insert error:', err.message);
  }
}

main();
