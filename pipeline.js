
require('dotenv').config();
const axios = require('axios');
const xml2js = require('xml2js');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const Groq = require('groq-sdk');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
      model: 'llama-3.1-8b-instant',
      max_tokens: 500,
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

// DuckDuckGo search fallback for website
async function searchWebsite(startupName) {
  try {
    const query = encodeURIComponent(`${startupName} Indian startup official website`);
    const response = await axios.get(`https://html.duckduckgo.com/html/?q=${query}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('.result__url').each((i, el) => {
      if (i < 5) results.push($(el).text().trim());
    });

    $('.result__a').each((i, el) => {
      if (i < 5) {
        const href = $(el).attr('href');
        if (href) results.push(href);
      }
    });

    const blocklist = [
      'yourstory', 'inc42', 'entrackr', 'economictimes', 'techcrunch',
      'moneycontrol', 'livemint', 'crunchbase', 'linkedin', 'twitter',
      'facebook', 'instagram', 'wikipedia', 'startupnews', 'google',
      'duckduckgo', 'bing', 'reddit', 'quora', 'glassdoor', 'ambitionbox',
      'tracxn', 'zaubacorp', 'tofler', 'indiafilings', 'business-standard',
      'thehindu', 'ndtv', 'zeebiz', 'vccircle'
    ];

    for (const r of results) {
      const lower = r.toLowerCase();
      const isBlocked = blocklist.some(b => lower.includes(b));
      if (!isBlocked && (lower.includes('http') || lower.includes('.'))) {
        let clean = r;
        if (r.includes('uddg=')) {
          clean = decodeURIComponent(r.split('uddg=')[1]);
        }
        try {
          const url = new URL(clean.startsWith('http') ? clean : 'https://' + clean);
          return url.origin;
        } catch {
          continue;
        }
      }
    }

    return null;
  } catch (err) {
    console.error('  DDG search failed:', err.message);
    return null;
  }
}

async function isDuplicate(articleUrl, startupName) {
  const { data: urlCheck } = await supabase
    .from('startups')
    .select('id')
    .eq('article_url', articleUrl)
    .limit(1);

  if (urlCheck && urlCheck.length > 0) return true;

  if (startupName) {
    const { data: nameCheck } = await supabase
      .from('startups')
      .select('id')
      .ilike('name', startupName.trim())
      .limit(1);

    if (nameCheck && nameCheck.length > 0) return true;
  }

  return false;
}

async function pushToSupabase(parsed, articleUrl, website) {
  const { error } = await supabase
    .from('startups')
    .insert([{
      name: parsed.startup_name,
      founders: parsed.founders,
      industry: parsed.industry,
      stage: parsed.funding_stage,
      description: parsed.description,
      article_url: articleUrl,
      website: website || null,
      added_at: new Date().toISOString()
    }]);

  if (error) {
    console.error('Supabase insert failed:', error.message);
  } else {
    console.log(`✅ Added: ${parsed.startup_name}`);
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

      // Use website from article if Groq found it, else search DDG
      let website = parsed.website || null;
      if (!website) {
        console.log(`🔎 Searching website for: ${parsed.startup_name}`);
        await wait(1500);
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