#!/usr/bin/env node
/**
 * Scrapes FAQs from server/views/pages/faq.njk,
 * parses categories, questions, and answers,
 * and saves into server/db/seeds/data/faqs.json.
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const FAQ_FILE = path.join(REPO_ROOT, 'server', 'views', 'pages', 'faq.njk');
const OUT_PATH = path.join(__dirname, '..', 'db', 'seeds', 'data', 'faqs.json');

function main() {
  const content = fs.readFileSync(FAQ_FILE, 'utf8');

  // Extract from HTML details blocks
  const categoryBlocks = content.split('<div class="faq-category');
  const faqs = [];
  let sortOrder = 0;

  for (let i = 1; i < categoryBlocks.length; i++) {
    const block = categoryBlocks[i];
    const titleMatch = block.match(/<h2 class="faq-category-title"[^>]*>([\s\S]*?)<\/h2>/i);
    let category = 'General';
    if (titleMatch) {
      const raw = titleMatch[1].replace(/&amp;/g, '&').trim();
      if (raw.includes('General')) category = 'General';
      else if (raw.includes('Products & Models') || raw.includes('Models')) category = 'Products & Models';
      else if (raw.includes('Pricing & Financing') || raw.includes('Financing')) category = 'Pricing & Financing';
      else if (raw.includes('Construction Process')) category = 'Construction Process';
      else if (raw.includes('Quality & Getting Started') || raw.includes('Started')) category = 'Quality & Getting Started';
      else category = raw.replace(/^What are the\s+/i, '').replace(/\s+questions\??$/i, '');
    }

    const itemMatches = block.matchAll(/<details class="faq-item">[\s\S]*?<summary>([\s\S]*?)<\/summary>[\s\S]*?<div class="faq-answer">([\s\S]*?)<\/div>[\s\S]*?<\/details>/gi);

    for (const match of itemMatches) {
      const question = match[1].trim();
      let answer = match[2].trim();
      if (question && answer) {
        faqs.push({
          question,
          answer,
          category,
          published: true,
          sort_order: sortOrder++,
        });
      }
    }
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(faqs, null, 2));

  console.log(`Scraped ${faqs.length} FAQs across ${new Set(faqs.map(f => f.category)).size} categories -> ${path.relative(REPO_ROOT, OUT_PATH)}`);
  process.exit(0);
}

main();
