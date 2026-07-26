<?php
$directory = 'c:\Users\Maria\Documents\WEB\BONGSHAI HOUSING';
$html_files = glob($directory . '\*.html');

$audit = [
    'not_in_sitemap' => [],
    'broken_internal_links' => [],
    'missing_local_seo_schema' => [],
    'missing_geo_tags' => [],
    'has_noindex' => []
];

// 1. Read sitemap.xml
$sitemap_file = $directory . '\sitemap.xml';
$sitemap_urls = [];
if (file_exists($sitemap_file)) {
    $sitemap_content = file_get_contents($sitemap_file);
    preg_match_all('/<loc>(.*?)<\/loc>/is', $sitemap_content, $matches);
    foreach ($matches[1] as $url) {
        $basename = basename(parse_url($url, PHP_URL_PATH));
        if (empty($basename)) $basename = 'index.html';
        $sitemap_urls[] = $basename;
    }
}

// Map filenames to full paths for easy checking
$file_basenames = [];
foreach ($html_files as $file) {
    $file_basenames[] = basename($file);
}

foreach ($html_files as $file) {
    $basename = basename($file);
    $content = file_get_contents($file);

    // Sitemap check
    if (!in_array($basename, $sitemap_urls)) {
        $audit['not_in_sitemap'][] = $basename;
    }

    // Broken links check
    preg_match_all('/href=["\'](.*?)["\']/i', $content, $links);
    foreach ($links[1] as $link) {
        if (strpos($link, 'http') !== 0 && strpos($link, 'mailto:') !== 0 && strpos($link, 'tel:') !== 0) {
            $link_basename = explode('#', $link)[0];
            $link_basename = explode('?', $link_basename)[0];
            if (!empty($link_basename) && strpos($link_basename, '.html') !== false) {
                if (!in_array($link_basename, $file_basenames)) {
                    $audit['broken_internal_links'][] = "$basename -> $link";
                }
            }
        }
    }

    // Local SEO Schema
    if (strpos(strtolower($content), 'schema.org/localbusiness') === false && 
        strpos(strtolower($content), 'schema.org/realestateagent') === false &&
        strpos(strtolower($content), 'schema.org/generalcontractor') === false) {
        $audit['missing_local_seo_schema'][] = $basename;
    }

    // Geo tags
    if (strpos(strtolower($content), 'geo.region') === false) {
        $audit['missing_geo_tags'][] = $basename;
    }

    // Noindex check
    if (strpos(strtolower($content), 'noindex') !== false) {
        $audit['has_noindex'][] = $basename;
    }
}

echo "=== DEEP AUDIT RESULTS ===\n";
echo "Pages missing from sitemap.xml: " . count($audit['not_in_sitemap']) . "\n";
echo "Broken Internal Links Found: " . count(array_unique($audit['broken_internal_links'])) . "\n";
echo "Pages missing Local SEO Schema (JSON-LD or Microdata): " . count($audit['missing_local_seo_schema']) . "\n";
echo "Pages missing Geo Meta Tags: " . count($audit['missing_geo_tags']) . "\n";
echo "Pages with 'noindex' tag: " . count($audit['has_noindex']) . "\n";

file_put_contents($directory . '\deep_audit_results_temp.json', json_encode($audit, JSON_PRETTY_PRINT));
?>
