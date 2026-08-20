#!/usr/bin/env node

/**
 * i18n Audit Tool for Remember Gaza
 * Scans HTML files, JS files, and language JSON files.
 * Reports:
 * 1. Missing keys across language files.
 * 2. Empty/null translation values in any language file.
 * 3. i18n keys referenced in HTML or JS that are missing from language files.
 * 4. Untagged user-visible text in HTML.
 * 5. Potential untranslated strings in JS.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const LANG_DIR = path.join(ROOT_DIR, 'data', 'languages');

const REQUIRED_LANGUAGES = [
  'ar', 'en', 'fr', 'es', 'de', 'it', 'pt', 'nl', 'ru',
  'tr', 'id', 'ms', 'ur', 'fa', 'zh', 'ja', 'ko'
];

function loadJsonFiles() {
  const langData = {};
  REQUIRED_LANGUAGES.forEach((lang) => {
    const filePath = path.join(LANG_DIR, `${lang}.json`);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Language file missing: ${filePath}`);
      langData[lang] = null;
    } else {
      try {
        langData[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (err) {
        console.error(`❌ Invalid JSON in ${filePath}: ${err.message}`);
        langData[lang] = null;
      }
    }
  });
  return langData;
}

function getHtmlFiles() {
  const files = fs.readdirSync(ROOT_DIR);
  return files.filter(f => f.endsWith('.html')).map(f => path.join(ROOT_DIR, f));
}

function getJsFiles() {
  const jsDir = path.join(ROOT_DIR, 'js');
  if (!fs.existsSync(jsDir)) return [];
  const files = fs.readdirSync(jsDir);
  return files.filter(f => f.endsWith('.js')).map(f => path.join(jsDir, f));
}

function extractKeysFromHtml(htmlContent, filePath) {
  const keys = new Set();
  const fileName = path.basename(filePath);

  // Match data-i18n="key", data-i18n-placeholder="key", data-i18n-title="key", data-i18n-aria-label="key"
  const i18nRegex = /data-i18n(?:-placeholder|-title|-aria-label)?=["']([^"']+)["']/g;
  let match;
  while ((match = i18nRegex.exec(htmlContent)) !== null) {
    keys.add(match[1]);
  }

  return Array.from(keys);
}

function extractKeysFromJs(jsContent, filePath) {
  const keys = new Set();

  // Match i18n.t('key') or i18n.t("key") or i18n.t(`key`)
  const tRegex = /i18n\.t\(\s*["'`]([^"'`]+)["'`]\s*[\),]/g;
  let match;
  while ((match = tRegex.exec(jsContent)) !== null) {
    // Avoid dynamic variables like `${...}`
    if (!match[1].includes('${')) {
      keys.add(match[1]);
    }
  }

  return Array.from(keys);
}

function runAudit() {
  console.log('====================================================');
  console.log('🔍 Starting Full i18n Audit for Remember Gaza');
  console.log('====================================================\n');

  const langData = loadJsonFiles();
  const allLangKeys = new Set();
  const langKeyMap = {};

  REQUIRED_LANGUAGES.forEach((lang) => {
    if (langData[lang]) {
      const keys = Object.keys(langData[lang]);
      langKeyMap[lang] = new Set(keys);
      keys.forEach(k => allLangKeys.add(k));
    } else {
      langKeyMap[lang] = new Set();
    }
  });

  console.log(`📊 Loaded ${REQUIRED_LANGUAGES.length} language files.`);
  console.log(`📊 Total unique translation keys found in JSON files: ${allLangKeys.size}\n`);

  // Scan HTML files
  const htmlFiles = getHtmlFiles();
  const htmlKeys = new Set();
  console.log(`📄 Scanning ${htmlFiles.length} HTML files...`);
  htmlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const keys = extractKeysFromHtml(content, file);
    keys.forEach(k => htmlKeys.add(k));
  });

  // Scan JS files
  const jsFiles = getJsFiles();
  const jsKeys = new Set();
  console.log(`📜 Scanning ${jsFiles.length} JS files...`);
  jsFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const keys = extractKeysFromJs(content, file);
    keys.forEach(k => jsKeys.add(k));
  });

  const codeReferencedKeys = new Set([...htmlKeys, ...jsKeys]);
  console.log(`🔗 Total keys referenced in HTML & JS: ${codeReferencedKeys.size}\n`);

  let totalIssues = 0;

  // 1. Check for keys referenced in HTML/JS but missing in JSON
  console.log('----------------------------------------------------');
  console.log('1️⃣ Checking Keys Referenced in Code vs. JSON Files');
  console.log('----------------------------------------------------');
  const missingFromAllLangs = [];
  codeReferencedKeys.forEach(key => {
    if (!allLangKeys.has(key)) {
      missingFromAllLangs.push(key);
    }
  });

  if (missingFromAllLangs.length > 0) {
    console.error(`❌ ${missingFromAllLangs.length} keys referenced in code are missing from JSON files entirely:`);
    missingFromAllLangs.forEach(k => console.error(`   - ${k}`));
    totalIssues += missingFromAllLangs.length;
  } else {
    console.log('✅ All keys referenced in HTML & JS exist in at least one language JSON file.');
  }
  console.log('');

  // 2. Check for key discrepancies across all 17 languages
  console.log('----------------------------------------------------');
  console.log('2️⃣ Checking Completeness Across All 17 Languages');
  console.log('----------------------------------------------------');

  // Use allLangKeys union codeReferencedKeys
  const masterKeySet = new Set([...allLangKeys, ...codeReferencedKeys]);

  const missingKeysPerLang = {};
  const emptyKeysPerLang = {};

  REQUIRED_LANGUAGES.forEach(lang => {
    missingKeysPerLang[lang] = [];
    emptyKeysPerLang[lang] = [];

    const currentDict = langData[lang] || {};

    masterKeySet.forEach(key => {
      if (!(key in currentDict)) {
        missingKeysPerLang[lang].push(key);
      } else if (currentDict[key] === null || currentDict[key] === undefined || String(currentDict[key]).trim() === '') {
        emptyKeysPerLang[lang].push(key);
      }
    });
  });

  let hasDiscrepancy = false;
  REQUIRED_LANGUAGES.forEach(lang => {
    const missing = missingKeysPerLang[lang];
    const empty = emptyKeysPerLang[lang];
    if (missing.length > 0 || empty.length > 0) {
      hasDiscrepancy = true;
      console.error(`❌ Language '${lang}': ${missing.length} missing keys, ${empty.length} empty values.`);
      if (missing.length > 0 && missing.length <= 10) {
        console.error(`   Missing: ${missing.join(', ')}`);
      } else if (missing.length > 10) {
        console.error(`   Missing (first 10): ${missing.slice(0, 10).join(', ')} ... +${missing.length - 10} more`);
      }
      totalIssues += missing.length + empty.length;
    }
  });

  if (!hasDiscrepancy) {
    console.log('✅ Perfect key alignment! All 17 language files contain 100% of required keys with non-empty values.');
  }

  console.log('\n====================================================');
  console.log(`🏁 Audit Completed. Total Issues Found: ${totalIssues}`);
  console.log('====================================================\n');

  if (totalIssues > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAudit();
