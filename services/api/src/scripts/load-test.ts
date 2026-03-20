
//@ts-nocheck
//// scripts/load-test.js
// node scripts/load-test.js
// Make sure your server is running first: docker compose up

const BASE_URL = 'http://localhost:3000';

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep  = ms => new Promise(r => setTimeout(r, ms));
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

function printTable(title, rows) {
  console.log(`\n${'─'.repeat(55)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(55));
  for (const [label, value] of rows) {
    console.log(`  ${label.padEnd(30)} ${value}`);
  }
  console.log('─'.repeat(55));
}

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx    = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[idx];
}

// ── Test 1: Shard distribution ─────────────────────────────────────────────
async function testShardDistribution() {
  console.log('\n🔵 TEST 1: Shard Distribution');
  console.log('Creating 300 URLs and checking which shard each lands on...\n');

  const counts    = { 'shard-0': 0, 'shard-1': 0, 'shard-2': 0 };
  const bar       = pct => '█'.repeat(Math.round(pct / 2)).padEnd(50, '░');
  const created   = [];
  const errors    = [];

  await Promise.all(
    Array.from({ length: 300 }, async (_, i) => {
      try {
        const res  = await fetch(`${BASE_URL}/api/shorten`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ longUrl: `https://example.com/page-${i}` }),
        });
        const data = await res.json();
        if (data.success) {
          created.push(data.shortCode);
          // Your API should return shardId — add it to the response
          // if not, we infer from the code
          const shard = data.shardId ?? inferShard(data.shortCode);
          counts[shard] = (counts[shard] ?? 0) + 1;
        }
      } catch (err) {
        errors.push(err.message);
      }
    })
  );

  console.log('Distribution:');
  for (const [shard, count] of Object.entries(counts)) {
    const pct = (count / created.length * 100).toFixed(1);
    console.log(`  ${shard}: ${bar(pct)} ${pct}% (${count} URLs)`);
  }

  printTable('Shard Distribution Summary', [
    ['Total created',   `${created.length} / 300`],
    ['Errors',          `${errors.length}`],
    ['Most loaded shard', `${Math.max(...Object.values(counts))} URLs`],
    ['Least loaded shard',`${Math.min(...Object.values(counts))} URLs`],
    ['Distribution OK?', Object.values(counts).every(c => {
      const pct = c / created.length * 100;
      return pct > 25 && pct < 45;
    }) ? '✅ Yes — within 25–45% each' : '❌ Uneven — check hash ring'],
  ]);

  return created;
}

// ── Test 2: Redirect latency ────────────────────────────────────────────────
async function testRedirectLatency(codes) {
  console.log('\n🟡 TEST 2: Redirect Latency');
  console.log(`Hitting ${codes.length} URLs 10 times each...\n`);

  const latencies = [];
  const errors    = [];

  for (const code of codes) {
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      try {
        const res = await fetch(`${BASE_URL}/${code}`, { redirect: 'manual' });
        const ms  = Date.now() - start;
        latencies.push(ms);
        if (res.status !== 302) errors.push(`${code}: got ${res.status}`);
      } catch (err) {
        errors.push(err.message);
      }
    }
  }

  printTable('Redirect Latency Results', [
    ['Total requests',   latencies.length],
    ['Errors',           errors.length],
    ['Min latency',      `${Math.min(...latencies)}ms`],
    ['Max latency',      `${Math.max(...latencies)}ms`],
    ['Avg latency',      `${(latencies.reduce((a,b)=>a+b,0)/latencies.length).toFixed(1)}ms`],
    ['p50 latency',      `${percentile(latencies, 50)}ms`],
    ['p95 latency',      `${percentile(latencies, 95)}ms`],
    ['p99 latency',      `${percentile(latencies, 99)}ms`],
    ['Under 50ms?',      `${latencies.filter(l=>l<50).length}/${latencies.length} requests`],
  ]);
}

// ── Test 3: Concurrency — prove no duplicate short codes ──────────────────
async function testConcurrency() {
  console.log('\n🟠 TEST 3: Concurrency — 100 simultaneous creates');
  console.log('All 100 requests fire at the exact same moment...\n');

  const CONCURRENT = 100;
  const results    = [];
  const errors     = [];
  const start      = Date.now();

  // Fire all 100 at exactly the same time
  const responses = await Promise.allSettled(
    Array.from({ length: CONCURRENT }, (_, i) =>
      fetch(`${BASE_URL}/api/shorten`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ longUrl: `https://concurrent-test.com/url-${i}` }),
      }).then(r => r.json())
    )
  );

  const duration = Date.now() - start;

  for (const r of responses) {
    if (r.status === 'fulfilled' && r.value.success) {
      results.push(r.value.shortCode);
    } else {
      errors.push(r.reason?.message ?? 'unknown error');
    }
  }

  // Check for duplicates
  const unique     = new Set(results);
  const duplicates = results.length - unique.size;

  printTable('Concurrency Test Results', [
    ['Total fired',        CONCURRENT],
    ['Succeeded',          results.length],
    ['Failed',             errors.length],
    ['Duration',           `${duration}ms`],
    ['Unique codes',       unique.size],
    ['Duplicate codes',    duplicates],
    ['No duplicates?',     duplicates === 0 ? '✅ All codes unique' : `❌ ${duplicates} duplicates found!`],
    ['Throughput',         `${(results.length / (duration / 1000)).toFixed(0)} creates/sec`],
  ]);

  return [...unique];
}

// ── Test 4: Sustained load ────────────────────────────────────────────────
async function testSustainedLoad(codes) {
  console.log('\n🔴 TEST 4: Sustained Load — 30 seconds');
  console.log('Firing as many requests as possible for 30 seconds...\n');

  const DURATION_MS   = 30_000;
  const CONCURRENCY   = 20;    // 20 parallel workers
  const latencies     = [];
  const errors        = [];
  let   totalRequests = 0;
  let   running       = true;

  setTimeout(() => { running = false; }, DURATION_MS);

  const start = Date.now();

  // Worker function — keeps firing until time is up
  async function worker() {
    while (running) {
      const code = random(codes);
      const t    = Date.now();
      try {
        const res = await fetch(`${BASE_URL}/${code}`, { redirect: 'manual' });
        latencies.push(Date.now() - t);
        totalRequests++;
        if (res.status !== 302) errors.push(res.status);
      } catch (err) {
        errors.push(err.message);
        totalRequests++;
      }
    }
  }

  // Print live progress every 5 seconds
  const progressInterval = setInterval(() => {
    const elapsed  = ((Date.now() - start) / 1000).toFixed(0);
    const rps      = (totalRequests / ((Date.now() - start) / 1000)).toFixed(0);
    const avgLat   = latencies.length
      ? (latencies.slice(-100).reduce((a,b)=>a+b,0) / Math.min(100, latencies.length)).toFixed(0)
      : 0;
    process.stdout.write(`\r  ⏱  ${elapsed}s | Requests: ${totalRequests} | RPS: ${rps} | Avg latency: ${avgLat}ms | Errors: ${errors.length}   `);
  }, 1000);

  // Run all workers simultaneously
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  clearInterval(progressInterval);
  console.log(''); // newline after progress

  const totalDuration = (Date.now() - start) / 1000;

  printTable('Sustained Load Results (30s)', [
    ['Total requests',     totalRequests.toLocaleString()],
    ['Errors',             errors.length],
    ['Error rate',         `${(errors.length / totalRequests * 100).toFixed(2)}%`],
    ['Avg RPS',            `${(totalRequests / totalDuration).toFixed(0)} req/s`],
    ['Min latency',        `${Math.min(...latencies)}ms`],
    ['Avg latency',        `${(latencies.reduce((a,b)=>a+b,0)/latencies.length).toFixed(1)}ms`],
    ['p95 latency',        `${percentile(latencies, 95)}ms`],
    ['p99 latency',        `${percentile(latencies, 99)}ms`],
    ['Max latency',        `${Math.max(...latencies)}ms`],
    ['Success rate',       `${((1 - errors.length/totalRequests)*100).toFixed(2)}%`],
  ]);
}

// ── Test 5: Invalid inputs ────────────────────────────────────────────────
async function testEdgeCases() {
  console.log('\n⚪ TEST 5: Edge Cases');

  const cases = [
    { name: 'Missing longUrl',     body: {},                              expectedStatus: 400 },
    { name: 'Invalid URL format',  body: { longUrl: 'not-a-url' },        expectedStatus: 400 },
    { name: 'Non-http protocol',   body: { longUrl: 'ftp://example.com' },expectedStatus: 400 },
    { name: 'Non-existent code',   url: `${BASE_URL}/zzzz999`,            expectedStatus: 404 },
    { name: 'Empty short code',    url: `${BASE_URL}/`,                   expectedStatus: 404 },
  ];

  console.log('');
  for (const tc of cases) {
    try {
      const res = tc.url
        ? await fetch(tc.url, { redirect: 'manual' })
        : await fetch(`${BASE_URL}/api/shorten`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(tc.body),
          });

      const pass = res.status === tc.expectedStatus;
      console.log(`  ${pass ? '✅' : '❌'} ${tc.name.padEnd(25)} expected ${tc.expectedStatus}, got ${res.status}`);
    } catch (err) {
      console.log(`  ❌ ${tc.name.padEnd(25)} threw error: ${err.message}`);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║           URL SHORTENER — LOAD TEST SUITE             ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log(`\nTarget: ${BASE_URL}`);
  console.log('Make sure docker compose up is running before this.\n');

  try {
    // Test 1 — distribution (also seeds codes for later tests)
    const distributionCodes = await testShardDistribution();
    await sleep(500);

    // Test 2 — redirect latency using seeded codes
    await testRedirectLatency(distributionCodes.slice(0, 20));
    await sleep(500);

    // Test 3 — concurrency
    const concurrentCodes = await testConcurrency();
    await sleep(500);

    // Test 4 — sustained load using all codes collected so far
    const allCodes = [...distributionCodes, ...concurrentCodes];
    await testSustainedLoad(allCodes);
    await sleep(500);

    // Test 5 — edge cases
    await testEdgeCases();

    console.log('\n✅ All tests complete.\n');

  } catch (err) {
    console.error('\n❌ Test suite crashed:', err.message);
    process.exit(1);
  }
}

main();