// backend/scripts/enrichData.js
// Smart India Hackathon PS 26014 - Cross-Departmental PostGIS Data Enrichment
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// 1. Auto-load backend/.env if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [k, ...v] = trimmed.split('=');
        if (k && v.length && !process.env[k.trim()]) {
          process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
  }
}

async function enrichDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📡 Connecting to PostGIS Database on Supabase...');
    await client.connect();
    console.log('✅ Connected successfully.');

    // 2. Add cross-departmental columns if not present
    console.log('🛠️ Adding cross-departmental schema columns (Water, Power, Environmental)...');
    await client.query(`
      ALTER TABLE parcels 
      ADD COLUMN IF NOT EXISTS water_connection_id VARCHAR(50),
      ADD COLUMN IF NOT EXISTS power_connection_id VARCHAR(50),
      ADD COLUMN IF NOT EXISTS environmental_zone VARCHAR(100) DEFAULT 'Standard';

      CREATE INDEX IF NOT EXISTS idx_parcels_water ON parcels (water_connection_id);
      CREATE INDEX IF NOT EXISTS idx_parcels_power ON parcels (power_connection_id);
      CREATE INDEX IF NOT EXISTS idx_parcels_env_zone ON parcels (environmental_zone);
    `);
    console.log('✅ Columns and indexes verified.');

    // 3. High-performance, deterministic set-based UPDATE across all parcels
    console.log('🔄 Enriching parcels with realistic Indian citizen names & utility connections...');
    const startTime = Date.now();

    const updateQuery = `
      UPDATE parcels
      SET 
        owner_name = CASE 
          WHEN owner_name LIKE 'Citizen %' OR owner_name = 'Registered Owner' OR owner_name IS NULL THEN
            (ARRAY[
              'Rajesh Kumar', 'Priya Sharma', 'Ananya Deshmukh', 'Vikramaditya Hegde',
              'Suresh Gowda', 'Meenakshi Sundaram', 'Arjun Reddy', 'Kavita Rao',
              'Deepak Verma', 'Pooja Patel', 'Ramesh Chandra', 'Sunita Murthy',
              'Harpreet Singh', 'Gurpreet Kaur', 'Amitabh Sengupta', 'Sneha Kulkarni',
              'Manoj Bajpai', 'Divya Nair', 'Karthik Subbaraj', 'Lakshmi Narayanan',
              'Venkatesh Prasad', 'Radhika Apte', 'Naveen Jindal', 'Aditi Rao'
            ])[1 + floor(abs(hashtext(ulpin)) % 24)::int]
          ELSE owner_name
        END,
        water_connection_id = COALESCE(
          water_connection_id, 
          'BWSSB-W-' || lpad((abs(hashtext(ulpin || 'water')) % 90000 + 10000)::text, 5, '0')
        ),
        power_connection_id = COALESCE(
          power_connection_id, 
          'BESCOM-E-' || lpad((abs(hashtext(ulpin || 'power')) % 90000 + 10000)::text, 5, '0')
        ),
        environmental_zone = COALESCE(
          environmental_zone, 
          (ARRAY[
            'Standard', 'Standard', 'Standard', 'Standard', 
            'Buffer Zone - Lake', 'Heritage Zone', 'Eco-Sensitive Corridor'
          ])[1 + floor(abs(hashtext(ulpin || 'env')) % 7)::int]
        );
    `;

    const result = await client.query(updateQuery);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Successfully updated ${result.rowCount} parcels in ${duration}s!`);

    // 4. Sample verification
    console.log('\n📊 Sample enriched records:');
    const samples = await client.query(`
      SELECT ulpin, owner_name, khasra_no, zone_type, water_connection_id, power_connection_id, environmental_zone 
      FROM parcels 
      LIMIT 5;
    `);
    console.table(samples.rows);

  } catch (err) {
    console.error('❌ Data enrichment failed:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.');
  }
}

enrichDatabase();
