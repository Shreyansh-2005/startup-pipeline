const SUPABASE_URL = 'https://coohoqzpvxtdcqflwvaw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const APOLLO_KEY = process.env.APOLLO_API_KEY;
const HUNTER_KEY = process.env.HUNTER_API_KEY;

async function supabaseSelect() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/startups?select=id,name,website,founders&website=not.is.null&founder_email=is.null`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return res.json();
}

async function supabaseUpdate(id, update) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/startups?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(update)
  });
  return res.ok;
}

async function getEmailFromHunter(domain, firstName,lastName) {
  if (!HUNTER_KEY) {
    console.log('⚠️ No Hunter API key — skipping email lookup');
    return null;
  }
  try {
    const url = `https://api.hunter.io/v2/email-finder?domain=${domain}&first_name=${firstName}&last_name=${lastName}&api_key=${HUNTER_KEY}`;
    const res = await fetch(url);

    if (res.status === 429) {
      console.log('⚠️ Hunter free limit reached — skipping for now');
      return null;
    }
    if (!res.ok) {
      console.log(`⚠️ Hunter error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const email = data.data?.email || null;
    console.log(`📧 Hunter result for ${domain} (${firstName}): ${email}`);
    return email;
  } catch (err) {
    console.log(`⚠️ Hunter exception: ${err.message}`);
    return null;
  }
}

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
    } else {
      const data = await res.json();
      const org = data.organizations?.[0];

      if (!org) {
        console.log(`❌ Not found on Apollo: ${startup.name} (${domain})`);
      } else {
        const update = {
          year_founded: org.founded_year?.toString() ?? null,
          employee_count: org.estimated_num_employees?.toString() ?? null,
          linkedin_url: org.linkedin_url ?? null,
        };

        const ok = await supabaseUpdate(startup.id, update);
        if (!ok) {
          console.log(`❌ Supabase update failed for ${startup.name}`);
        } else {
          console.log(`✅ ${startup.name} | Founded: ${update.year_founded} | Employees: ${update.employee_count}`);
        }
      }
    }

    await new Promise(r => setTimeout(r, 4000));

  } catch (err) {
    console.log(`❌ Apollo error for ${startup.name}:`, err.message);
  }

  // Hunter email lookup — runs regardless of Apollo result
  if (startup.founders && domain) {
    const fullName = startup.founders.split(',')[0].trim();
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts[1] || '';
    const email = await getEmailFromHunter(domain, firstName, lastName);
    if (email) {
      await supabaseUpdate(startup.id, { founder_email: email });
    }
  }
}

async function run() {
  const startups = await supabaseSelect();

  if (!Array.isArray(startups)) {
    console.error('Failed to fetch startups:', startups);
    process.exit(1);
  }

  console.log(`🔍 Enriching ${startups.length} startups...`);

  for (const startup of startups) {
    await enrichStartup(startup);
  }

  console.log('🎉 Done');
}

run();