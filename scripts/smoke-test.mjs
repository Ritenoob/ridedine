#!/usr/bin/env node
/**
 * Smoke test: checks that both deployed Vercel apps respond with HTTP 200.
 *
 * Usage:
 *   WEB_URL=https://ridendine-web.vercel.app \
 *   ADMIN_URL=https://ridendine-admin.vercel.app \
 *   node scripts/smoke-test.mjs
 */

const WEB_URL = process.env.WEB_URL || "https://ridendine-web.vercel.app";
const ADMIN_URL = process.env.ADMIN_URL || "https://ridendine-admin.vercel.app";

async function checkUrl(label, url) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (res.ok) {
      console.log(`✅ ${label}: ${url} → HTTP ${res.status}`);
      return true;
    } else {
      console.error(`❌ ${label}: ${url} → HTTP ${res.status}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ ${label}: ${url} → Error: ${err.message}`);
    return false;
  }
}

const results = await Promise.all([
  checkUrl("ridendine-web", WEB_URL),
  checkUrl("ridendine-admin", ADMIN_URL),
]);

if (results.every(Boolean)) {
  console.log("\n✅ All smoke tests passed.");
  process.exit(0);
} else {
  console.error("\n❌ One or more smoke tests failed.");
  process.exit(1);
}
