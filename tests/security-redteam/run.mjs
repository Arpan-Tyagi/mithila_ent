#!/usr/bin/env node
// Runs the red-team suites against the LOCAL Supabase stack (and, if
// REDTEAM_APP_URL is set, a locally running app). Usage:
//   npm run test:redteam
//   REDTEAM_APP_URL=http://localhost:3100 npm run test:redteam
import { execSync, spawnSync } from 'node:child_process';

const status = JSON.parse(execSync('npx --no-install supabase status -o json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
const url = status.API_URL;
const host = new URL(url).hostname;
if (!['127.0.0.1', 'localhost', '::1'].includes(host)) {
  console.error(`Refusing to run: Supabase API ${url} is not local.`);
  process.exit(2);
}
if (process.env.REDTEAM_APP_URL) {
  const appHost = new URL(process.env.REDTEAM_APP_URL).hostname;
  if (!['127.0.0.1', 'localhost', '::1'].includes(appHost)) {
    console.error(`Refusing to run: app ${process.env.REDTEAM_APP_URL} is not local.`);
    process.exit(2);
  }
}
const env = {
  ...process.env,
  REDTEAM_SUPABASE_URL: url,
  REDTEAM_SERVICE_KEY: status.SERVICE_ROLE_KEY,
  REDTEAM_ANON_KEY: status.ANON_KEY,
};
const r = spawnSync('npx', ['vitest', 'run', 'tests/security-redteam', '--reporter=verbose', ...process.argv.slice(2)], {
  env, stdio: 'inherit', shell: process.platform === 'win32',
});
process.exit(r.status ?? 1);
