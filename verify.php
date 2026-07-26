<?php
$results = [];

// 1. Verify Homepage copy
$indexHtml = file_get_contents('index.html');
if (strpos($indexHtml, 'all over Bangladesh — anywhere, anyplace') !== false) {
    $results[] = "[PASS] Homepage SEO copy updated.";
} else {
    $results[] = "[FAIL] Homepage SEO copy missing.";
}

// 2. Verify Testimonials
if (strpos($indexHtml, 'The Wave Resort') !== false && strpos($indexHtml, 'Probachol Sector 3') !== false && strpos($indexHtml, 'Cumilla') !== false) {
    $results[] = "[PASS] Homepage testimonials updated.";
} else {
    $results[] = "[FAIL] Homepage testimonials missing.";
}

// 3. Verify Homepage Images
if (strpos($indexHtml, 'chotrogram_1784362457177.png') !== false && strpos($indexHtml, 'vanga_faridpur.jpg') !== false) {
    $results[] = "[PASS] Homepage project images updated.";
} else {
    $results[] = "[FAIL] Homepage project images missing.";
}

// 4. Verify Single Story UI and Logic (lcv-109.html)
$lcvHtml = file_get_contents('lcv-109.html');
if (strpos($lcvHtml, '<div class="area-selector"') !== false) {
    $results[] = "[PASS] Single-story (lcv-109) UI selector updated to modern box.";
} else {
    $results[] = "[FAIL] Single-story (lcv-109) UI selector missing.";
}

if (strpos($lcvHtml, '"950": { bed: "3 Rooms"') !== false && strpos($lcvHtml, '"1200": { bed: "4 Rooms"') !== false) {
    $results[] = "[PASS] Single-story (lcv-109) 950/1200 logic updated.";
} else {
    $results[] = "[FAIL] Single-story (lcv-109) 950/1200 logic missing.";
}

// 5. Verify Duplex UI and Logic (dv-112.html)
$dvHtml = file_get_contents('dv-112.html');
if (strpos($dvHtml, '<div class="area-selector"') !== false) {
    $results[] = "[PASS] Duplex (dv-112) UI selector updated to modern box.";
} else {
    $results[] = "[FAIL] Duplex (dv-112) UI selector missing.";
}

if (strpos($dvHtml, '"950x2": { bed: "6 Rooms", bath: "4 Rooms", dining: "2 Spaces", drawing: "2 Rooms" }') !== false) {
    $results[] = "[PASS] Duplex (dv-112) 950x2 logic properly doubled (dining/drawing).";
} else {
    $results[] = "[FAIL] Duplex (dv-112) 950x2 logic NOT properly doubled.";
}

echo implode("\n", $results) . "\n";
?>
