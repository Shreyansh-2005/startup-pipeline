import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://coohoqzpvxtdcqflwvaw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const APOLLO_KEY = process.env.APOLLO_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function extractDomain(website) {
  try {
    const url = new URL(website.startsWith('http') ? website : 'https://' + website);
    return url.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

async function enrichStartup(startup) {
  const domain = extractDomain(startup.website);
  if (!domain) {
    console.log(`⚠️  Skipping ${startup.name} — invalid website`);
    return;
  }

  try {
    const res = await fetch('https://api.apollo.io/api/v1/organizations/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': APOLLO_KEY
      },
      body: JSON.stringify({
        q_organization_domains: domain,
        page: 1,
        per_page: 1
      })
    });

    if (!res.ok) {
      console.log(`⚠️  Apollo error for ${startup.name}: ${res.status}`);
      return;
    }

    const data = await res.json();
    const org = data.organizations?.[0];

    if (!org) {
      console.log(`❌ Not found on Apollo: ${startup.name} (${domain})`);
      return;
    }

    const update = {
      year_founded: org.founded_year?.toString() ?? null,
      employee_count: org.estimated_num_employees?.toString() ?? null,
      linkedin_url: org.linkedin_url ?? null,
    };

    const { error } = await supabase
      .from('startups')
      .update(update)
      .eq('id', startup.id);

    if (error) {
      console.log(`❌ Supabase update failed for ${startup.name}:`, error.message);
    } else {
      console.log(`✅ ${startup.name} | Founded: ${update.year_founded} | Employees: ${update.employee_count} | LinkedIn: ${update.linkedin_url}`);
    }

    // Respect Apollo rate limits
    await new Promise(r => setTimeout(r, 300));

  } catch (err) {
    console.log(`❌ Error enriching ${startup.name}:`, err.message);
  }
}

async function run() {
  const { data: startups, error } = await supabase
    .from('startups')
    .select('id, name, website')
    .not('website', 'is', null)
    .is('year_founded', null);

  if (error) {
    console.error('Failed to fetch startups:', error.message);
    process.exit(1);
  }

  console.log(`🔍 Enriching ${startups.length} startups...`);

  for (const startup of startups) {
    await enrichStartup(startup);
  }

  console.log('🎉 Done');
}

run();