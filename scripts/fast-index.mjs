#!/usr/bin/env node

/**
 * LORABIZ FAST-TRACK INDEXING SCRIPT
 * 
 * Automatically pushes your live URLs to:
 * 1. IndexNow API (Instant crawl by Microsoft Bing, Yahoo, Yandex, Seznam, Naver)
 * 2. Google Indexing API (Direct high-priority push to Googlebot via Service Account)
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'https://lorabiz.com';
const INDEXNOW_KEY = 'c74fa901d84e4c2b9a71b3e8e29a5841';
const KEY_LOCATION = `${BASE_URL}/${INDEXNOW_KEY}.txt`;

// Public URLs to index immediately
const URLS_TO_INDEX = [
  `${BASE_URL}/`,
  `${BASE_URL}/services/cac`,
  `${BASE_URL}/services/cac/annual-returns`,
  `${BASE_URL}/services/scuml`,
  `${BASE_URL}/services/tax-id`,
  `${BASE_URL}/services/nin`,
  `${BASE_URL}/services/utilities`,
  `${BASE_URL}/blog`,
  `${BASE_URL}/blog/how-to-file-cac-annual-returns-nigeria`,
  `${BASE_URL}/faq`,
  `${BASE_URL}/compliance`,
  `${BASE_URL}/contact`,
];

console.log('🚀 [Fast-Index] Starting Search Engine Fast-Track Indexing...');
console.log(`📋 Total URLs queued for indexing: ${URLS_TO_INDEX.length}`);

// -----------------------------------------------------------------------------
// 1. PING INDEXNOW (BING, YAHOO, YANDEX, SEZNAM, NAVER)
// -----------------------------------------------------------------------------
async function submitToIndexNow() {
  console.log('\n🌐 [1/2] Submitting to IndexNow Protocol (Bing, Yahoo, Yandex)...');

  try {
    const payload = {
      host: 'lorabiz.com',
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList: URLS_TO_INDEX,
    };

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 200 || res.status === 202) {
      console.log(`   ✅ IndexNow accepted ${URLS_TO_INDEX.length} URLs (HTTP ${res.status}). Search engines notified!`);
    } else {
      const text = await res.text();
      console.log(`   ⚠️ IndexNow response (HTTP ${res.status}): ${text}`);
    }
  } catch (err) {
    console.warn(`   ❌ IndexNow submission error: ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// 2. GOOGLE INDEXING API (DIRECT HIGH-PRIORITY GOOGLEBOT CRAWL)
// -----------------------------------------------------------------------------
async function submitToGoogleIndexingApi() {
  console.log('\n⚡ [2/2] Checking for Google Cloud Service Account credentials...');

  let serviceAccount = null;

  // Check 1: File 'service-account.json' in project root
  const saFilePath = path.join(process.cwd(), 'service-account.json');
  if (fs.existsSync(saFilePath)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(saFilePath, 'utf8'));
    } catch (e) {
      console.warn('   ⚠️ Failed to parse service-account.json:', e.message);
    }
  }

  // Check 2: Environment variable GOOGLE_SERVICE_ACCOUNT_KEY
  if (!serviceAccount && process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } catch (e) {
      console.warn('   ⚠️ Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY environment variable.');
    }
  }

  if (!serviceAccount || !serviceAccount.client_email || !serviceAccount.private_key) {
    console.log('   ℹ️  Google Indexing API is available but requires a Google Service Account.');
    console.log('      To enable instant Googlebot crawling:');
    console.log('      1. Create a Service Account in Google Cloud Console with "Web Search Indexing API" enabled.');
    console.log('      2. Add the service account email as an Owner in Google Search Console.');
    console.log('      3. Place the downloaded key as "service-account.json" or set GOOGLE_SERVICE_ACCOUNT_KEY in .env.');
    return;
  }

  console.log(`   🔑 Found Service Account: ${serviceAccount.client_email}`);

  try {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claimSet = Buffer.from(
      JSON.stringify({
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/indexing',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      })
    ).toString('base64url');

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(`${header}.${claimSet}`);
    const signature = sign.sign(serviceAccount.private_key, 'base64url');
    const jwt = `${header}.${claimSet}.${signature}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Failed to obtain Google access token.');
    }

    console.log('   ✅ Authenticated with Google Indexing API. Submitting URLs to Googlebot...');

    for (const url of URLS_TO_INDEX) {
      const publishRes = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        body: JSON.stringify({
          url,
          type: 'URL_UPDATED',
        }),
      });

      if (publishRes.ok) {
        console.log(`   🚀 Queued for instant Googlebot crawl: ${url}`);
      } else {
        const errJson = await publishRes.json();
        console.warn(`   ⚠️ Warning for ${url}:`, errJson.error?.message || publishRes.statusText);
      }
    }
  } catch (err) {
    console.error('   ❌ Google Indexing API error:', err.message);
  }
}

// -----------------------------------------------------------------------------
// EXECUTE ALL
// -----------------------------------------------------------------------------
async function run() {
  await submitToIndexNow();
  await submitToGoogleIndexingApi();
  console.log('\n✨ [Fast-Index] Search engine notification pipeline complete!\n');
}

run();
