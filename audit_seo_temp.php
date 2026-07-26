<?php
$directory = 'c:\Users\Maria\Documents\WEB\BONGSHAI HOUSING';
$html_files = glob($directory . '\*.html');

$audit = [
    'missing_title' => [], 'long_title' => [], 'short_title' => [],
    'missing_meta_desc' => [], 'long_meta_desc' => [], 'short_meta_desc' => [],
    'missing_h1' => [], 'multiple_h1' => [],
    'missing_canonical' => [], 'missing_og_tags' => [],
    'images_missing_alt' => []
];

foreach ($html_files as $file) {
    $basename = basename($file);
    $content = file_get_contents($file);

    // Title
    if (preg_match('/<title>(.*?)<\/title>/is', $content, $matches)) {
        $title = trim($matches[1]);
        if (strlen($title) > 60) $audit['long_title'][] = $basename;
        elseif (strlen($title) < 30) $audit['short_title'][] = $basename;
    } else {
        $audit['missing_title'][] = $basename;
    }

    // Meta Description
    if (preg_match('/<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']/is', $content, $matches) ||
        preg_match('/<meta[^>]*content=["\'](.*?)["\'][^>]*name=["\']description["\']/is', $content, $matches)) {
        $desc = trim($matches[1]);
        if (strlen($desc) > 160) $audit['long_meta_desc'][] = $basename;
        elseif (strlen($desc) < 50) $audit['short_meta_desc'][] = $basename;
    } else {
        $audit['missing_meta_desc'][] = $basename;
    }

    // H1
    $h1_count = preg_match_all('/<h1[^>]*>(.*?)<\/h1>/is', $content, $matches);
    if ($h1_count == 0) $audit['missing_h1'][] = $basename;
    elseif ($h1_count > 1) $audit['multiple_h1'][] = $basename;

    // Canonical
    if (!preg_match('/<link[^>]*rel=["\']canonical["\'][^>]*>/is', $content)) {
        $audit['missing_canonical'][] = $basename;
    }

    // Open Graph
    if (!preg_match('/<meta[^>]*property=["\']og:title["\']/is', $content)) {
        $audit['missing_og_tags'][] = $basename;
    }

    // Image Alt
    preg_match_all('/<img([^>]*)>/is', $content, $img_matches);
    $missing_alt = 0;
    foreach ($img_matches[1] as $img) {
        if (!preg_match('/alt=["\'][^"\']*["\']/is', $img) || preg_match('/alt=["\']\s*["\']/is', $img)) {
            $missing_alt++;
        }
    }
    if ($missing_alt > 0) $audit['images_missing_alt'][$basename] = $missing_alt;
}

echo "Total HTML files audited: " . count($html_files) . "\n";
echo "Missing Titles: " . count($audit['missing_title']) . "\n";
echo "Long Titles (>60): " . count($audit['long_title']) . "\n";
echo "Short Titles (<30): " . count($audit['short_title']) . "\n";
echo "Missing Meta Descriptions: " . count($audit['missing_meta_desc']) . "\n";
echo "Long Meta Desc (>160): " . count($audit['long_meta_desc']) . "\n";
echo "Short Meta Desc (<50): " . count($audit['short_meta_desc']) . "\n";
echo "Missing H1: " . count($audit['missing_h1']) . "\n";
echo "Multiple H1: " . count($audit['multiple_h1']) . "\n";
echo "Missing Canonical Tags: " . count($audit['missing_canonical']) . "\n";
echo "Missing Open Graph Tags: " . count($audit['missing_og_tags']) . "\n";
echo "Pages with missing Image Alt Tags: " . count($audit['images_missing_alt']) . "\n";

file_put_contents($directory . '\seo_audit_results_temp.json', json_encode($audit, JSON_PRETTY_PRINT));
?>
