#!/usr/bin/env node

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
const getArg = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : '';
};

const domain = getArg('domain') || process.env.APP_BASE_URL || '';
const env = getArg('env') || process.env.PAYPAL_ENV || 'sandbox';
const uid = getArg('uid') || '';
const eventId = getArg('event-id') || '';
const paymentId = getArg('payment-id') || '';

const now = new Date();
const stamp = now.toISOString().replace(/[:.]/g, '-');

const templatePath = resolve('S1_EVIDENCE_TEMPLATE.md');
if (!existsSync(templatePath)) {
  console.error('❌ Missing S1_EVIDENCE_TEMPLATE.md in repository root.');
  process.exit(1);
}

const template = readFileSync(templatePath, 'utf8');
const hydrated = template
  .replace('- Date/Time:', `- Date/Time: ${now.toISOString()}`)
  .replace('- Environment: sandbox/live', `- Environment: ${env}`)
  .replace('- Domain:', `- Domain: ${domain || '<set-domain>'}`)
  .replace('- Target uid:', `- Target uid: ${uid || '<set-uid>'}`)
  .replace('- Event ID:', `- Event ID: ${eventId || '<set-event-id>'}`)
  .replace('- Payment ID:', `- Payment ID: ${paymentId || '<set-payment-id>'}`);

const outDir = resolve('evidence', 's1');
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, `${stamp}.md`);
writeFileSync(outPath, hydrated);

console.log(`✅ Created evidence file: ${outPath}`);
console.log('Next: fill the result fields while running sandbox payment + replay.');