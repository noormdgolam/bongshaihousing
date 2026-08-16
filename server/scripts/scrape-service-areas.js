#!/usr/bin/env node
/**
 * Scrapes all 64 districts in Bangladesh from service-areas.html / js/bd-geo-data.js,
 * groups by official Administrative Division, maps dedicated static landing pages,
 * and saves into server/db/seeds/data/service_areas.json.
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const OUT_PATH = path.join(__dirname, '..', 'db', 'seeds', 'data', 'service_areas.json');

// Dedicated district landing pages available on Bongshai Housing
const DEDICATED_PAGES = {
  'Dhaka': 'steel-building-dhaka.html',
  'Chattogram': 'steel-building-chotrogram.html',
  'Gazipur': 'steel-building-gazipur.html',
  'Comilla': 'prefab-housing-cumilla.html',
  'Cumilla': 'prefab-housing-cumilla.html',
  'Bogura': 'prefab-cottage-bogra-rangpur.html',
  'Bogra': 'prefab-cottage-bogra-rangpur.html',
  'Rangpur': 'prefab-cottage-bogra-rangpur.html',
  'Faridpur': 'steel-building-faridpur.html',
  'Sylhet': 'steel-building-sylhet.html',
  'Khulna': 'steel-building-khulna.html',
  'Rajshahi': 'steel-building-rajshahi.html',
  'Barishal': 'steel-building-barisal.html',
  'Barisal': 'steel-building-barisal.html',
  'Mymensingh': 'steel-building-mymensingh.html',
  'Narayanganj': 'steel-building-narayanganj.html',
  'Coxsbazar': 'steel-building-coxsbazar.html',
  "Cox's Bazar": 'steel-building-coxsbazar.html',
  'Jashore': 'steel-building-jashore.html',
  'Narsingdi': 'steel-building-narsingdi.html',
  'Tangail': 'steel-building-tangail.html',
  'Manikganj': 'steel-building-manikganj.html',
};

// Bangladesh 8 Administrative Divisions mapping for all 64 districts
const DIVISION_BY_DISTRICT = {
  // Dhaka Division (13)
  'Dhaka': 'Dhaka Division',
  'Gazipur': 'Dhaka Division',
  'Narayanganj': 'Dhaka Division',
  'Narsingdi': 'Dhaka Division',
  'Tangail': 'Dhaka Division',
  'Manikganj': 'Dhaka Division',
  'Munshiganj': 'Dhaka Division',
  'Faridpur': 'Dhaka Division',
  'Gopalganj': 'Dhaka Division',
  'Madaripur': 'Dhaka Division',
  'Rajbari': 'Dhaka Division',
  'Shariatpur': 'Dhaka Division',
  'Kishoreganj': 'Dhaka Division',

  // Chattogram Division (11)
  'Chattogram': 'Chattogram Division',
  'Coxsbazar': 'Chattogram Division',
  "Cox's Bazar": 'Chattogram Division',
  'Cumilla': 'Chattogram Division',
  'Comilla': 'Chattogram Division',
  'Feni': 'Chattogram Division',
  'Brahmanbaria': 'Chattogram Division',
  'Rangamati': 'Chattogram Division',
  'Noakhali': 'Chattogram Division',
  'Chandpur': 'Chattogram Division',
  'Lakshmipur': 'Chattogram Division',
  'Khagrachari': 'Chattogram Division',
  'Bandarban': 'Chattogram Division',

  // Rajshahi Division (8)
  'Rajshahi': 'Rajshahi Division',
  'Bogura': 'Rajshahi Division',
  'Bogra': 'Rajshahi Division',
  'Pabna': 'Rajshahi Division',
  'Sirajganj': 'Rajshahi Division',
  'Naogaon': 'Rajshahi Division',
  'Natore': 'Rajshahi Division',
  'Joypurhat': 'Rajshahi Division',
  'Chapai Nawabganj': 'Rajshahi Division',

  // Khulna Division (10)
  'Khulna': 'Khulna Division',
  'Jashore': 'Khulna Division',
  'Bagerhat': 'Khulna Division',
  'Chuadanga': 'Khulna Division',
  'Jhenaidah': 'Khulna Division',
  'Kushtia': 'Khulna Division',
  'Magura': 'Khulna Division',
  'Meherpur': 'Khulna Division',
  'Narail': 'Khulna Division',
  'Satkhira': 'Khulna Division',

  // Barishal Division (6)
  'Barishal': 'Barishal Division',
  'Barisal': 'Barishal Division',
  'Barguna': 'Barishal Division',
  'Bhola': 'Barishal Division',
  'Jhalokati': 'Barishal Division',
  'Patuakhali': 'Barishal Division',
  'Pirojpur': 'Barishal Division',

  // Sylhet Division (4)
  'Sylhet': 'Sylhet Division',
  'Habiganj': 'Sylhet Division',
  'Moulvibazar': 'Sylhet Division',
  'Sunamganj': 'Sylhet Division',

  // Rangpur Division (8)
  'Rangpur': 'Rangpur Division',
  'Dinajpur': 'Rangpur Division',
  'Gaibandha': 'Rangpur Division',
  'Kurigram': 'Rangpur Division',
  'Lalmonirhat': 'Rangpur Division',
  'Nilphamari': 'Rangpur Division',
  'Panchagarh': 'Rangpur Division',
  'Thakurgaon': 'Rangpur Division',

  // Mymensingh Division (4)
  'Mymensingh': 'Mymensingh Division',
  'Jamalpur': 'Mymensingh Division',
  'Netrokona': 'Mymensingh Division',
  'Sherpur': 'Mymensingh Division',
};

function main() {
  // Read districts from js/bd-geo-data.js
  const geoFile = fs.readFileSync(path.join(REPO_ROOT, 'js', 'bd-geo-data.js'), 'utf8');
  const getGeoData = new Function(geoFile + '; return bdGeoData;');
  const rawDistricts = getGeoData() || [];

  const seen = new Set();
  const serviceAreas = [];

  for (const item of rawDistricts) {
    const districtName = item.district.trim();
    if (seen.has(districtName.toLowerCase())) continue;
    seen.add(districtName.toLowerCase());

    const division = DIVISION_BY_DISTRICT[districtName] || 'Dhaka Division';
    const pageSlug = DEDICATED_PAGES[districtName] || null;
    const hasDedicatedPage = Boolean(pageSlug);

    serviceAreas.push({
      district: districtName,
      division,
      has_dedicated_page: hasDedicatedPage,
      page_slug: pageSlug,
      coordinates: item.coordinates || null,
      upazilas_count: Array.isArray(item.upazillas) ? item.upazillas.length : 0,
    });
  }

  // Sort by division, then district
  serviceAreas.sort((a, b) => {
    if (a.division !== b.division) return a.division.localeCompare(b.division);
    return a.district.localeCompare(b.district);
  });

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(serviceAreas, null, 2));

  console.log(`Scraped ${serviceAreas.length} service areas (64 districts) -> ${path.relative(REPO_ROOT, OUT_PATH)}`);
  const dedicatedCount = serviceAreas.filter(s => s.has_dedicated_page).length;
  console.log(`Dedicated landing pages: ${dedicatedCount} / ${serviceAreas.length}`);
}

main();
