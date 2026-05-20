
require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const Groq = require('groq-sdk');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchArticleContent(url) {
  try {
    const response = await axios.get(url, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(response.data);
    $('script, style, nav, footer, header, aside').remove();
    const text = $('article').text() || $('main').text() || $('body').text();
    return text.replace(/\s+/g, ' ').trim().slice(0, 2000);
  } catch (err) {
    return '';
  }
}

async function extractFromArticle(startupName, articleUrl) {
  const content = await fetchArticleContent(articleUrl);
  if (!content) return { founders: null, website: null };

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `
Extract data about the startup "${startupName}" from this article.

Return ONLY raw JSON, no markdown, no explanation.
Fields:
- founders (string, comma-separated full names, or null)
- website (string, official startup website URL only if explicitly mentioned, or null)

Article: ${content}
        `
      }]
    });

    const raw = response.choices[0].message.content;
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    return { founders: null, website: null };
  }
}

async function searchWebsite(startupName) {
  // Clean the name: lowercase, remove spaces and common suffixes
  const cleaned = startupName
    .toLowerCase()
    .replace(/\b(technologies|solutions|services|india|tech|ai|labs|ventures|innovations)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();

  // Try these URL patterns in order
  const candidates = [
    `https://${cleaned}.com`,
    `https://${cleaned}.in`,
    `https://${cleaned}.io`,
    `https://www.${cleaned}.com`,
    `https://get${cleaned}.com`,
    `https://try${cleaned}.com`,
  ];

  for (const url of candidates) {
    try {
      await axios.head(url, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      console.log(`  ✅ Found: ${url}`);
      return url;
    } catch (err) {
      // URL didn't respond, try next
    }
  }

  return null;
}

async function main() {
  console.log('🔄 Backfill starting...\n');

  const { data: rows, error } = await supabase
    .from('startups')
    .select('id, name, founders, article_url, website');

  if (error) {
    console.error('Failed to fetch rows:', error.message);
    return;
  }

  const toProcess = rows.filter(r => !r.founders || !r.website);
  console.log(`Found ${toProcess.length} rows needing backfill\n`);

  for (const row of toProcess) {
    console.log(`\n🔍 ${row.name}`);
    const updates = {};

    // Try scraping article first if URL exists
    if (row.article_url) {
      console.log(`  📄 Scraping article...`);
      const extracted = await extractFromArticle(row.name, row.article_url);

      if (!row.founders && extracted.founders) {
        updates.founders = extracted.founders;
        console.log(`  👥 Founders: ${extracted.founders}`);
      }
      if (!row.website && extracted.website) {
        updates.website = extracted.website;
        console.log(`  🌐 Website from article: ${extracted.website}`);
      }
    }

    // DDG fallback if website still missing
    if (!row.website && !updates.website) {
      console.log(`  🔎 Searching DuckDuckGo...`);
      await wait(1500);
      const found = await searchWebsite(row.name);
      if (found) {
        updates.website = found;
        console.log(`  🌐 Website from DDG: ${found}`);
      } else {
        console.log(`  ⚠️  No website found`);
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('startups')
        .update(updates)
        .eq('id', row.id);

      if (updateError) {
        console.error(`  ❌ Update failed: ${updateError.message}`);
      } else {
        console.log(`  ✅ Updated`);
      }
    } else {
      console.log(`  ⏭️  Nothing to update`);
    }

    await wait(2000);
  }

  console.log('\n✅ Backfill complete');
}

main();