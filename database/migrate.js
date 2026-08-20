/**
 * Palestinian Souls / Remember Gaza - JSON Data Migration Helper
 * Utility to parse static JSON archive files (victims, journalists, press_killed_in_gaza, martyrs48)
 * and generate PostgreSQL/Supabase INSERT SQL batch statements or migrate directly via REST API.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_SQL = path.join(__dirname, 'data_migration.sql');

function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function processMigration() {
  console.log('[Migration] Starting JSON data parse and SQL generation...');
  let sqlStatements = [];
  sqlStatements.push('-- Palestinian Souls Migration SQL Batch');
  sqlStatements.push('BEGIN;');

  // 1. Victims JSON
  const victimsPath = path.join(DATA_DIR, 'victims.json');
  if (fs.existsSync(victimsPath)) {
    try {
      const victims = JSON.parse(fs.readFileSync(victimsPath, 'utf8'));
      console.log(`[Migration] Processing ${victims.length} records from victims.json`);
      victims.forEach((v, index) => {
        const id = v.id || v.record_id || `gaza_${index + 1}`;
        const nameAr = v.name || v.ar_name || 'غير محدد';
        const nameEn = v.en_name || v.en_name || null;
        const age = parseInt(v.age, 10) || null;
        const gender = v.gender || v.sex || null;
        const city = v.district || v.city || null;
        const idNumber = v.id_number || null;
        const photoUrl = v.photo_url || v.photo || null;
        const bio = v.story || v.biography || null;

        sqlStatements.push(
          `INSERT INTO martyrs (id, category, name_ar, name_en, age, gender, city, id_number, photo_url, bio, status) ` +
          `VALUES (${escapeSQL(id)}, 'Gazans', ${escapeSQL(nameAr)}, ${escapeSQL(nameEn)}, ${age ? age : 'NULL'}, ${escapeSQL(gender)}, ${escapeSQL(city)}, ${escapeSQL(idNumber)}, ${escapeSQL(photoUrl)}, ${escapeSQL(bio)}, 'PUBLISHED') ` +
          `ON CONFLICT (id) DO NOTHING;`
        );
      });
    } catch (e) {
      console.error('[Migration] Error reading victims.json:', e.message);
    }
  }

  // 2. Journalists JSON
  const journalistsPath = path.join(DATA_DIR, 'press_killed_in_gaza.json');
  if (fs.existsSync(journalistsPath)) {
    try {
      const journalists = JSON.parse(fs.readFileSync(journalistsPath, 'utf8'));
      console.log(`[Migration] Processing ${journalists.length} records from press_killed_in_gaza.json`);
      journalists.forEach((j, index) => {
        const id = j.id || `press_${index + 1}`;
        const nameAr = j.name || j.ar_name || 'صحفي شهيد';
        const nameEn = j.en_name || null;
        const photoUrl = j.photo_url || j.photo || null;
        const bio = j.story || j.biography || j.role || null;

        sqlStatements.push(
          `INSERT INTO martyrs (id, category, name_ar, name_en, photo_url, bio, status) ` +
          `VALUES (${escapeSQL(id)}, 'Journalists', ${escapeSQL(nameAr)}, ${escapeSQL(nameEn)}, ${escapeSQL(photoUrl)}, ${escapeSQL(bio)}, 'PUBLISHED') ` +
          `ON CONFLICT (id) DO NOTHING;`
        );
      });
    } catch (e) {
      console.error('[Migration] Error reading press_killed_in_gaza.json:', e.message);
    }
  }

  sqlStatements.push('COMMIT;');

  fs.writeFileSync(OUTPUT_SQL, sqlStatements.join('\n'), 'utf8');
  console.log(`[Migration] Successfully generated SQL file: ${OUTPUT_SQL}`);
}

if (require.main === module) {
  processMigration();
}

module.exports = { processMigration };
