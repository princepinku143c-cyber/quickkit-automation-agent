#!/usr/bin/env node
import process from 'node:process';

const args = process.argv.slice(2);
const argBase = args.find((a) => a.startsWith('--base-url='));
const baseUrl = (argBase ? argBase.split('=')[1] : process.env.APP_BASE_URL || '').replace(/\/$/, '');

if (!baseUrl) {
  console.error('❌ Missing base URL. Use --base-url=https://your-domain or set APP_BASE_URL.');
  process.exit(1);
}

// FIX: Point to the actual webhook handler root, not a non-existent /health sub-path
const healthUrl = `${baseUrl}/api/billing/paypal/webhook`;

async function main() {
  console.log(`🔎 Checking webhook health: ${healthUrl}`);
  let response;
  try {
    response = await fetch(healthUrl, {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error(`❌ Network error while reaching health endpoint: ${error.message}`);
    process.exit(1);
  }

  if (!response.ok) {
    console.error(`❌ Health endpoint returned HTTP ${response.status}`);
    process.exit(1);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    console.error('❌ Health endpoint did not return valid JSON.');
    process.exit(1);
  }

  const checks = [
    { key: 'ok', pass: payload.ok === true, expected: 'true', actual: String(payload.ok) },
    {
      key: 'paypalEnv',
      pass: payload.paypalEnv === 'sandbox' || payload.paypalEnv === 'live',
      expected: 'sandbox|live',
      actual: String(payload.paypalEnv ?? 'undefined'),
    },
    {
      key: 'firebaseReady',
      pass: typeof payload.firebaseReady === 'boolean',
      expected: 'boolean',
      actual: String(payload.firebaseReady ?? 'undefined'),
    },
  ];

  console.log('\nHealth payload:');
  console.log(JSON.stringify(payload, null, 2));

  console.log('\nQuick checks:');
  let failed = 0;
  for (const check of checks) {
    if (check.pass) {
      console.log(`✅ ${check.key}: ${check.actual}`);
    } else {
      failed += 1;
      console.log(`❌ ${check.key}: expected ${check.expected}, got ${check.actual}`);
    }
  }

  if (failed > 0) {
    console.log('\n⚠️ Fix failed checks first, then rerun this command.');
    process.exit(1);
  }

  console.log('\n🚀 Ready for S1 external replay verification. Next manual steps:');
  console.log('1) Complete one sandbox PayPal payment.');
  console.log('2) Replay the same webhook event once from PayPal dashboard.');
  console.log('3) Fill evidence in S1_EVIDENCE_TEMPLATE.md.');
}

main();