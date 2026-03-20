// scripts/k6-stress-test.js
//
// WHAT IS THIS?
// This file stress tests your URL shortener using k6.
// k6 simulates many users hitting your API simultaneously.
//
// HOW TO RUN:
// ─────────────────────────────────────────────────────
// First time setup:
//   brew install k6                          (install k6)
//   npx ts-node scripts/seed.ts 50000        (seed 50k URLs)
//
// Then run:
//   k6 run --vus 50  --duration 60s scripts/k6-stress-test.js   (normal test)
//   k6 run --vus 100 --duration 60s scripts/k6-stress-test.js   (medium stress)
//   k6 run --vus 200 --duration 60s scripts/k6-stress-test.js   (heavy stress)
//
// WHAT IS A VU?
//   VU = Virtual User = one person using your app simultaneously
//   50 VUs = 50 people all clicking links at the same time, non-stop
//
// WHAT TO LOOK FOR IN RESULTS:
//   redirect_latency p95 < 50ms   ✅ good
//   errors rate      < 1%         ✅ good
//   http_req_failed  0.00%        ✅ good
// ─────────────────────────────────────────────────────

import http             from 'k6/http';
import { check }        from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { SharedArray }  from 'k6/data';

// ── Base URL ──────────────────────────────────────────────────────────────────
// Change this if your server runs on a different port
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// ── Load pre-seeded URLs ──────────────────────────────────────────────────────
// These are the 50k URLs created by: npx ts-node scripts/seed.ts 50000
// SharedArray loads the file ONCE and shares it across all VUs (memory efficient)
const REAL_CODES = new SharedArray('codes', () => {
  return JSON.parse(open('./seeded-codes.json'));
});

// ── Custom metrics ────────────────────────────────────────────────────────────
// These show up as separate rows in your k6 results
// Trend  = tracks min/avg/max/p95/p99 of a value (latency)
// Rate   = tracks what % of events were true (error rate)
// Counter= tracks a running total (how many redirects happened)
const redirectLatency = new Trend('redirect_latency',  true);
const createLatency   = new Trend('create_latency',    true);
const errorRate       = new Rate('errors');
const totalRedirects  = new Counter('total_redirects');
const totalCreates    = new Counter('total_creates');

// ── Thresholds — test FAILS if any of these are crossed ──────────────────────
// Think of these as your SLA (service level agreement)
// If your system can't meet these, k6 exits with an error
export const options = {
  thresholds: {
    redirect_latency: ['p(95)<50'],    // 95% of redirects must be under 50ms
    create_latency:   ['p(95)<200'],   // 95% of creates must be under 200ms
    errors:           ['rate<0.01'],   // less than 1% of checks can fail
    http_req_duration:['p(95)<100'],   // 95% of ALL requests under 100ms
    http_req_failed:  ['rate<0.01'],   // less than 1% of HTTP requests can fail
  },
};

// ── Default function — runs in a loop for every VU ───────────────────────────
// This is what each virtual user does repeatedly for the entire test duration
// 80% of the time: redirect (realistic — most users click links, not create them)
// 20% of the time: create a new short URL
export default function () {
  if (Math.random() < 0.8) {
    testRedirect();
  } else {
    testCreate();
  }
}

// ── Redirect test ─────────────────────────────────────────────────────────────
// Picks a random URL from your 50k seeded codes and hits GET /:code
// redirects: 0 means we stop at the 302 — we don't actually follow to google.com
// We just want to measure how fast YOUR server responds
function testRedirect() {
  // Pick a random code from the 50k seeded URLs
  const code = REAL_CODES[Math.floor(Math.random() * REAL_CODES.length)];

  const res = http.get(`${BASE_URL}/${code}`, {
    redirects: 0,             // stop at 302, don't follow to destination
    tags: { name: 'redirect' }, // group this in k6 results
  });

  // Track the latency for this request
  redirectLatency.add(res.timings.duration);
  totalRedirects.add(1);

  // check() returns true if ALL conditions pass, false if any fail
  // Failed checks count toward your error rate
  const ok = check(res, {
    // Must return 302 Found
    'status is 302':       r => r.status === 302,
    // Must have a Location header pointing to the original URL
    'has Location header': r => r.headers['Location'] !== undefined,
    // Must respond in under 100ms
    'latency under 100ms': r => r.timings.duration < 100,
  });

  // If any check failed, count it as an error
  errorRate.add(!ok);
}

// ── Create test ───────────────────────────────────────────────────────────────
// Creates a new short URL via POST /api/shorten
// Uses Date.now() in the URL so every request is unique — no duplicates
function testCreate() {
  const res = http.post(
    `${BASE_URL}/api/shorten`,
    // Body: the long URL to shorten
    JSON.stringify({
      longUrl: `https://example.com/article-${Date.now()}-${Math.random()}`
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags:    { name: 'create' },
    }
  );

  createLatency.add(res.timings.duration);
  totalCreates.add(1);

  const ok = check(res, {
    // Must return 201 Created
    'status is 201':       r => r.status === 201,
    // Response must contain a shortCode
    'has shortCode':       r => {
      try {
        return JSON.parse(r.body).shortCode !== undefined;
      } catch {
        return false;
      }
    },
    // Must respond in under 500ms
    'latency under 500ms': r => r.timings.duration < 500,
  });

  errorRate.add(!ok);
}