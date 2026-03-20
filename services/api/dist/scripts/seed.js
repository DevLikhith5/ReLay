"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/seed.ts
const fs_1 = require("fs");
const BASE_URL = 'http://localhost:3000';
// ── Realistic URL patterns ────────────────────────────────────────────────────
const DOMAINS = [
    'github.com', 'stackoverflow.com', 'medium.com',
    'dev.to', 'youtube.com', 'reddit.com',
    'twitter.com', 'linkedin.com', 'notion.so',
    'figma.com', 'vercel.app', 'netlify.app',
];
const PATHS = [
    '/articles', '/posts', '/questions', '/answers',
    '/videos', '/channels', '/repos', '/issues',
    '/products', '/docs', '/blog', '/profile',
];
const SLUGS = [
    'how-to-build-a-distributed-system',
    'understanding-kafka-internals',
    'postgres-sharding-guide',
    'redis-cache-patterns',
    'node-js-performance-tips',
    'system-design-interview-prep',
    'microservices-vs-monolith',
    'docker-kubernetes-guide',
    'typescript-best-practices',
    'clean-code-principles',
];
function generateUrl(index) {
    const domain = DOMAINS[index % DOMAINS.length];
    const path = PATHS[index % PATHS.length];
    const slug = SLUGS[index % SLUGS.length];
    const id = Math.floor(Math.random() * 999999);
    return `https://${domain}${path}/${slug}-${id}`;
}
// ── Seed function ─────────────────────────────────────────────────────────────
async function seed(total = 10000) {
    console.log(`\nSeeding ${total.toLocaleString()} URLs into ReLay...\n`);
    const codes = [];
    const errors = [];
    const BATCH = 50;
    const start = Date.now();
    for (let i = 0; i < total; i += BATCH) {
        const batchSize = Math.min(BATCH, total - i);
        const results = await Promise.allSettled(Array.from({ length: batchSize }, (_, j) => fetch(`${BASE_URL}/api/shorten`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                longUrl: generateUrl(i + j)
            }),
        }).then(r => r.json())));
        for (const r of results) {
            if (r.status === 'fulfilled' && r.value.success) {
                codes.push(r.value.shortCode);
            }
            else {
                errors.push(r.status === 'rejected' ? r.reason : JSON.stringify(r.value));
            }
        }
        // Progress bar
        const pct = Math.floor((codes.length / total) * 100);
        const bar = '█'.repeat(Math.floor(pct / 5)).padEnd(20, '░');
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        const rps = (codes.length / ((Date.now() - start) / 1000)).toFixed(0);
        process.stdout.write(`\r  [${bar}] ${pct}% | ${codes.length.toLocaleString()} URLs | ${rps} req/s | ${elapsed}s`);
    }
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log('\n');
    // ── Save codes to JSON for k6 ─────────────────────────────────────────────
    (0, fs_1.writeFileSync)('scripts/seeded-codes.json', JSON.stringify(codes, null, 2));
    // ── Print summary ─────────────────────────────────────────────────────────
    console.log('─'.repeat(50));
    console.log('  Seed Summary');
    console.log('─'.repeat(50));
    console.log(`  Total attempted   ${total.toLocaleString()}`);
    console.log(`  Succeeded         ${codes.length.toLocaleString()}`);
    console.log(`  Failed            ${errors.length}`);
    console.log(`  Duration          ${duration}s`);
    console.log(`  Avg speed         ${(codes.length / Number(duration)).toFixed(0)} URLs/sec`);
    console.log(`  Saved to          scripts/seeded-codes.json`);
    console.log('─'.repeat(50));
    if (errors.length > 0) {
        console.log('\nFirst 3 errors:');
        errors.slice(0, 3).forEach(e => console.log(' ', e));
    }
}
// Run with optional count arg: npx ts-node scripts/seed.ts 50000
const count = parseInt(process.argv[2] ?? '10000');
seed(count);
