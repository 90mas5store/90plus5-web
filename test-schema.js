const fs = require('fs');

async function check() {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

  if (!urlMatch || !keyMatch) return console.log("Keys missing");

  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();

  const res = await fetch(`${url}/rest/v1/?apikey=${key}`);
  const data = await res.json();
  
  if (data.definitions && data.definitions.orders) {
    fs.writeFileSync('enum_output.json', JSON.stringify(data.definitions.orders.properties.status.enum, null, 2));
    console.log("Written to enum_output.json");
  } else {
    console.log("No orders table found in spec");
  }
}
check();
