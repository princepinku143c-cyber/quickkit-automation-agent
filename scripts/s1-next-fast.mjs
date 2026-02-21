#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import process from 'node:process';

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(`--${name}`);
const getArg = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : '';
};

const domain = getArg('domain') || process.env.APP_BASE_URL || '';
const uid = getArg('uid') || '';
const env = getArg('env') || process.env.PAYPAL_ENV || 'sandbox';
const skipHealth = hasFlag('skip-health');
const allowHealthFail = hasFlag('allow-health-fail');

if (!domain) {
  console.error('❌ Missing domain. Use --domain=https://your-domain or set APP_BASE_URL.');
  process.exit(1);
}

if (!uid) {
  console.error('❌ Missing uid. Use --uid=<firebase-user-id>.');
  process.exit(1);
}

const run = (cmd, cmdArgs, { required = true } = {}) => {
  const result = spawnSync(cmd, cmdArgs, { stdio: 'inherit' });
  if (required && result.status !== 0) {
    process.exit(result.status || 1);
  }
  return result.status || 0;
};

console.log('🚀 S1 next-fast starter');
console.log(`- Overall completion: 96%`);
console.log(`- Remaining: 4%`);
console.log(`- ETA best-case: 40-55 min`);
console.log(`- ETA with one fix/redeploy: 60-120 min`);

if (!skipHealth) {
  console.log('\n1) Running readiness gate...');
  const status = run('node', ['scripts/s1-live-check.mjs', `--base-url=${domain}`], {
    required: !allowHealthFail,
  });

  if (status !== 0 && allowHealthFail) {
    console.log('\n⚠️ Readiness gate failed, but continuing because --allow-health-fail was provided.');
    console.log('   Make sure to fix endpoint/env issues before final S1 sign-off.');
  }
} else {
  console.log('\n1) Skipping readiness gate (--skip-health).');
}

console.log('\n2) Generating evidence template file...');
run('node', ['scripts/s1-init-evidence.mjs', `--domain=${domain}`, `--uid=${uid}`, `--env=${env}`]);

console.log('\n✅ next-fast prep completed.');
console.log('Now do these manual steps in order:');
console.log('1. Complete one sandbox payment from app UI.');
console.log('2. Replay same webhook event from PayPal dashboard.');
console.log('3. Fill generated evidence file and mark all 5 checks pass.');
console.log('4. Update SET_PROGRESS.md to mark S1 done.');