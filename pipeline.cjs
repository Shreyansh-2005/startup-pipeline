const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) process.env[key.trim()] = value.trim();
});

const axios = require('axios');
const xml2js = require('xml2js');
const cheerio = require('cheerio');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseHeaders = {
  'apikey': supabaseKey,
  'Authorization': `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};

const RSS_FEEDS = [
  'https://yourstory.com/feed',
  'https://inc42.com/feed/',
  'https://economictimes.indiatimes.com/tech/startups/rssfeeds/78570550.cms',
  'https://entrackr.com/feed/',
  'https://www.startupnews.fyi/feed'
];

const DELAY = 3000;

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchRSS(url) {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);
    const items = result.rss.channel[0].item || [];
    return items.map(item => ({
      title: item.title?.[0] || '',
      description: item.description?.[0] || '',
      link: item.link?.[0] || item.guid?.[0]?._ || item.guid?.[0] || '',
    }));
  } catch (err) {
    console.error(`RSS fetch failed for ${url}:`, err.message);
    return [];
  }
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

async function parseWithGroq(article) {
  try {
    const response = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `
You are extracting startup data from an Indian startup news article snippet.

Be aggressive — infer from context. If the article says "Founded by Rahul Sharma", extract "Rahul Sharma". If it says "Artiure, started by two IIT graduates Priya and Ankit", extract "Priya, Ankit".

Return ONLY raw JSON, no markdown, no explanation.

Fields:
- startup_name (string or null)
- founders (string, comma separated full names — extract even if partially mentioned, or null)
- industry (string or null)
- funding_stage (string: extract exactly as mentioned e.g. "Series A", "Seed", "Pre-Series A" or null)
- description (string, one line or null)
- website (string, official startup website URL only if explicitly mentioned in the article, or null)
- founder_email (string, founder's email if explicitly mentioned in article, or null)
- founder_linkedin (string, founder's LinkedIn URL if mentioned, or null)

Article Title: ${article.title}
Article Content: ${article.description}
        `
      }]
    });

    const raw = response.choices[0].message.content;
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);

  } catch (err) {
    console.error('Groq parse failed:', err.message);
    return null;
  }
}

async function searchWebsite(startupName) {
  const cleaned = startupName
    .toLowerCase()
    .replace(/\b(technologies|solutions|services|india|tech|ai|labs|ventures|innovations)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();

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
      return url;
    } catch (err) {
      // try next
    }
  }

  return null;
}

async function isDuplicate(articleUrl, startupName) {
  try {
    const urlCheck = await axios.get(
      `${supabaseUrl}/rest/v1/startups?article_url=eq.${encodeURIComponent(articleUrl)}&select=id&limit=1`,
      { headers: supabaseHeaders }
    );
    if (urlCheck.data.length > 0) return true;

    if (startupName) {
      const nameCheck = await axios.get(
        `${supabaseUrl}/rest/v1/startups?name=ilike.${encodeURIComponent(startupName.trim())}&select=id&limit=1`,
        { headers: supabaseHeaders }
      );
      if (nameCheck.data.length > 0) return true;
    }
  } catch (err) {
    console.error('Duplicate check failed:', err.message);
  }

  return false;
}

async function pushToSupabase(parsed, articleUrl, website) {
  try {
    await axios.post(
      `${supabaseUrl}/rest/v1/startups`,
      {
        name: parsed.startup_name,
        founders: parsed.founders,
        industry: parsed.industry,
        description: parsed.description,
        article_url: articleUrl,
        website: website || null,
        added_at: new Date().toISOString(),
        founder_email: parsed.founder_email || null,
        founder_linkedin: parsed.founder_linkedin || null,
      },
      { headers: supabaseHeaders }
    );
    console.log(`✅ Added: ${parsed.startup_name}`);
  } catch (err) {
    console.error('Supabase insert failed:', err.message);
  }
}

async function main() {
  console.log('🚀 Pipeline starting...\n');

  const keywords = [
    'startup', 'raises', 'raised', 'raise', 'funding', 'funded',
    'investment', 'invest', 'backed', 'acquires', 'launches', 'founded',
    'founder', 'bengaluru-based', 'mumbai-based', 'india', 'indian',
    'gurugram', 'noida', 'chennai', 'hyderabad', 'pune', 'ahmedabad',
    'fintech', 'saas', 'ai startup', 'edtech'
  ];

  for (const feedUrl of RSS_FEEDS) {
    console.log(`Fetching: ${feedUrl}`);
    const articles = await fetchRSS(feedUrl);
    console.log(`Found ${articles.length} articles — processing up to 30\n`);

    const recentArticles = articles.slice(0, 30);

    for (const article of recentArticles) {
      const isRelevant = keywords.some(k =>
        article.title.toLowerCase().includes(k) ||
        article.description.toLowerCase().includes(k)
      );
      if (!isRelevant) {
        console.log(`⏭️  Not relevant: ${article.title}`);
        continue;
      }

      console.log(`🔍 Parsing: ${article.title}`);

      const fullContent = await fetchArticleContent(article.link);
      console.log('📄 Content length:', fullContent.length);

      const enrichedArticle = {
        ...article,
        description: fullContent || article.description
      };

      const parsed = await parseWithGroq(enrichedArticle);
      console.log('🤖 Groq output:', JSON.stringify(parsed));

      if (!parsed || !parsed.startup_name) {
        console.log('⚠️  No Indian startup found, skipping\n');
        continue;
      }

      console.log('🔗 Article URL:', article.link);
      console.log('👥 Founders:', parsed.founders);

      const duplicate = await isDuplicate(article.link, parsed.startup_name);
      if (duplicate) {
        console.log(`⏭️  Duplicate: ${parsed.startup_name}`);
        continue;
      }

      let website = parsed.website || null;
      if (!website) {
        console.log(`🔎 Searching website for: ${parsed.startup_name}`);
        website = await searchWebsite(parsed.startup_name);
      }
      console.log(`🌐 Website: ${website}`);

      await pushToSupabase(parsed, article.link, website);

      console.log(`⏳ Waiting ${DELAY / 1000}s...\n`);
      await wait(DELAY);
    }
  }

  console.log('✅ Pipeline complete');
}

main();