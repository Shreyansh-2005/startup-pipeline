const fs = require('fs');
if (fs.existsSync('.env')) {
  const envFile = fs.readFileSync('.env', 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.trim();
  });
}

const axios = require('axios');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // service role, same as pipeline.cjs
const supabaseHeaders = {
  'apikey': supabaseKey,
  'Authorization': `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};

// Public, read-only search credentials — pulled from YC's own site network tab.
// This is the same key every visitor's browser uses to load ycombinator.com/companies.
const ALGOLIA_APP_ID = '45BWZJ1SGC';
const ALGOLIA_API_KEY = 'NzJmMWExZWYxYzY5OGYwN2VkYWM5YzRiM2VlNDFlM2I0ODU2YjQ2Yjg0MTFiNWE5NzY0NTMyZGI1OWEwMzVjY2FuYWx5dGljc1RhZ3M9eWNkYyZyZXN0cmljdEluZGljZXM9WUNDb21wYW55X3Byb2R1Y3Rpb24lMkNZQ0NvbXBhbnlfQnlfTGF1bmNoX0RhdGVfcHJvZHVjdGlvbiZ0YWdGaWx0ZXJzPSU1QiUyMnljZGNfcHVibGljJTIyJTVE';
const ALGOLIA_INDEX = 'YCCompany_production';

const stats = {
  fetched: 0,
  indiaMatched: 0,
  duplicatesSkipped: 0,
  inserted: 0,
  failed: 0,
};

// "regions" is a confirmed real facet on this index (seen in YC's own request
// payload). We don't know the exact facet VALUE for India yet (could be
// "India", "South Asia", "Asia", etc.) — fetchRegionValues() below looks that
// up for real before we filter on it, instead of guessing.
async function algoliaSearch(params) {
  const response = await axios.post(
    `https://${ALGOLIA_APP_ID.toLowerCase()}-dsn.algolia.net/1/indexes/*/queries`,
    { requests: [{ indexName: ALGOLIA_INDEX, params }] },
    {
      headers: {
        'x-algolia-application-id': ALGOLIA_APP_ID,
        'x-algolia-api-key': ALGOLIA_API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data.results[0];
}

async function findIndiaRegionValue() {
  const result = await algoliaSearch('query=&hitsPerPage=0&facets=regions&maxValuesPerFacet=1000');
  const regionValues = Object.keys(result.facets?.regions || {});
  console.log('Available region facet values:', regionValues);

  const match = regionValues.find(v => v.toLowerCase().includes('india'));
  if (match) {
    console.log(`✅ Found matching region facet value: "${match}"`);
    return match;
  }
  console.log('⚠️  No exact "India" region facet found — falling back to text search on all fields.');
  return null;
}

async function fetchYCPage(page, regionValue) {
  const filterParam = regionValue
    ? `&facetFilters=%5B%22regions%3A${encodeURIComponent(regionValue)}%22%5D`
    : '';
  return await algoliaSearch(`query=&hitsPerPage=1000&page=${page}${filterParam}`);
}

// Fallback only used if we couldn't find a real "regions" facet value for India.
function isIndiaBased(hit) {
  const haystack = JSON.stringify(hit).toLowerCase();
  return haystack.includes('india') && !haystack.includes('indiana');
}

async function isDuplicate(website, startupName) {
  try {
    if (website) {
      const websiteCheck = await axios.get(
        `${supabaseUrl}/rest/v1/startups?website=eq.${encodeURIComponent(website)}&select=id&limit=1`,
        { headers: supabaseHeaders }
      );
      if (websiteCheck.data.length > 0) return true;
    }

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

async function pushToSupabase(hit) {
  try {
    await axios.post(
      `${supabaseUrl}/rest/v1/startups`,
      {
        name: hit.name,
        founders: null, // YC directory doesn't expose founder names publicly
        industry: hit.industry || (hit.industries ? hit.industries.join(', ') : null),
        description: hit.one_liner || null,
        article_url: hit.url || `https://www.ycombinator.com/companies/${hit.slug}`,
        website: hit.website || null,
        added_at: new Date().toISOString(),
        founder_email: null,
        founder_linkedin: null,
      },
      { headers: supabaseHeaders }
    );
    stats.inserted++;
    console.log(`✅ Added: ${hit.name}`);
  } catch (err) {
    stats.failed++;
    console.error(`❌ Insert failed for ${hit.name}:`, err.message);
  }
}

async function main() {
  console.log('🚀 YC India backfill starting...\n');

  const regionValue = await findIndiaRegionValue();

  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    console.log(`Fetching YC directory page ${page}...`);
    const result = await fetchYCPage(page, regionValue);
    totalPages = result.nbPages;
    stats.fetched += result.hits.length;

    // If we have a real region filter, Algolia already only returned India
    // hits — no need to re-filter client-side. Otherwise use the text fallback.
    const indiaHits = regionValue ? result.hits : result.hits.filter(isIndiaBased);
    stats.indiaMatched += indiaHits.length;
    console.log(`  → ${result.hits.length} companies, ${indiaHits.length} India-matched`);

    for (const hit of indiaHits) {
      const duplicate = await isDuplicate(hit.website, hit.name);
      if (duplicate) {
        stats.duplicatesSkipped++;
        console.log(`⏭️  Duplicate: ${hit.name}`);
        continue;
      }
      await pushToSupabase(hit);
    }

    page++;
  }

  console.log('\n========== YC BACKFILL SUMMARY ==========');
  console.log(`Total companies scanned: ${stats.fetched}`);
  console.log(`India-matched:           ${stats.indiaMatched}`);
  console.log(`Duplicates skipped:      ${stats.duplicatesSkipped}`);
  console.log(`Inserted:                ${stats.inserted}`);
  console.log(`Failed:                  ${stats.failed}`);
  console.log('===========================================\n');
  console.log('✅ Backfill complete');
}

main();