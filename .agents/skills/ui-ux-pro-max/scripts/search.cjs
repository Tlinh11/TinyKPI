#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node search.cjs <query> [--domain <domain>] [--max-results <n>]');
  console.log('Domains: ux, color, style, typography, chart, product, landing, design, icons');
  process.exit(0);
}

let query = args[0];
let domain = 'ux';
let maxResults = 5;

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--domain' || args[i] === '-d') domain = args[++i];
  if (args[i] === '--max-results' || args[i] === '-m') maxResults = parseInt(args[++i], 10);
}

const domainFiles = {
  ux: 'ux-guidelines.csv',
  color: 'colors.csv',
  style: 'styles.csv',
  typography: 'typography.csv',
  chart: 'charts.csv',
  product: 'products.csv',
  landing: 'landing.csv',
  design: 'design.csv',
  icons: 'icons.csv'
};

const fileName = domainFiles[domain] || 'ux-guidelines.csv';
const filePath = path.join(__dirname, '..', 'data', fileName);

if (!fs.existsSync(filePath)) {
  console.error('Data file not found:', filePath);
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
if (lines.length < 2) {
  console.log('No data found in', fileName);
  process.exit(0);
}

const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
const q = query.toLowerCase();

const matches = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (line.toLowerCase().includes(q)) {
    const cells = [];
    let cur = '', inQuotes = false;
    for (let c of line) {
      if (c === '"') inQuotes = !inQuotes;
      else if (c === ',' && !inQuotes) {
        cells.push(cur.trim().replace(/^"|"$/g, ''));
        cur = '';
      } else {
        cur += c;
      }
    }
    cells.push(cur.trim().replace(/^"|"$/g, ''));

    const obj = {};
    headers.forEach((h, idx) => { obj[h] = cells[idx] || ''; });
    matches.push(obj);
    if (matches.length >= maxResults) break;
  }
}

console.log('## UI/UX Pro Max Search Results');
console.log(`**Domain:** ${domain} | **Query:** ${query} | **Found:** ${matches.length}\n`);

matches.forEach((row, idx) => {
  console.log(`### Result ${idx + 1}`);
  for (const [k, v] of Object.entries(row)) {
    if (v) console.log(`- **${k}:** ${v}`);
  }
  console.log('');
});
