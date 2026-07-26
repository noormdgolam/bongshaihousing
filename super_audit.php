<?php
$directory = 'c:\Users\Maria\Documents\WEB\BONGSHAI HOUSING';
$html_files = glob($directory . '\*.html');

$audit = [
    'missing_local_assets' => [],
    'http_links' => [],
    'broken_anchor_links' => [],
    'missing_viewport' => [],
];

foreach ($html_files as $file) {
    $basename = basename($file);
    $content = file_get_contents($file);

    // 1. Missing Local Assets
    // Check images, scripts, links
    preg_match_all('/(?:src|href)=["\'](.*?)["\']/is', $content, $assets);
    foreach ($assets[1] as $asset) {
        if (strpos($asset, 'http') !== 0 && strpos($asset, 'mailto:') !== 0 && strpos($asset, 'tel:') !== 0 && strpos($asset, '#') !== 0) {
            $asset_clean = explode('?', $asset)[0]; // remove query params
            $asset_clean = ltrim(str_replace('/', '\\', $asset_clean), '\\');
            
            if ($asset_clean !== '' && strpos($asset_clean, '.html') === false) {
                $local_path = $directory . '\\' . $asset_clean;
                if (!file_exists($local_path)) {
                    $audit['missing_local_assets'][] = "$basename references missing asset: $asset";
                }
            }
        }
    }

    // 2. Mixed Content (HTTP links)
    // Only care about external resources loaded via HTTP instead of HTTPS (css, js, images)
    preg_match_all('/(?:src|href)=["\'](http:\/\/.*?)["\']/is', $content, $http_links);
    foreach ($http_links[1] as $link) {
        $audit['http_links'][] = "$basename uses HTTP instead of HTTPS: $link";
    }

    // 3. Broken Anchor Links
    preg_match_all('/href=["\']#(.*?)["\']/is', $content, $anchors);
    foreach ($anchors[1] as $anchor) {
        if (!empty($anchor)) {
            // Check if id="$anchor" or name="$anchor" exists
            if (strpos($content, 'id="' . $anchor . '"') === false && 
                strpos($content, "id='" . $anchor . "'") === false &&
                strpos($content, 'name="' . $anchor . '"') === false) {
                $audit['broken_anchor_links'][] = "$basename has broken internal anchor: #$anchor";
            }
        }
    }

    // 4. Missing Viewport
    if (stripos($content, 'name="viewport"') === false) {
        $audit['missing_viewport'][] = $basename;
    }
}

// Ensure unique reporting
$audit['missing_local_assets'] = array_unique($audit['missing_local_assets']);
$audit['http_links'] = array_unique($audit['http_links']);
$audit['broken_anchor_links'] = array_unique($audit['broken_anchor_links']);

echo "=== SUPER AUDIT RESULTS ===\n";
echo "Missing Local Assets (Images, CSS, JS): " . count($audit['missing_local_assets']) . "\n";
foreach(array_slice($audit['missing_local_assets'], 0, 10) as $msg) echo "  - $msg\n";

echo "\nHTTP Links (Mixed Content risk): " . count($audit['http_links']) . "\n";
foreach(array_slice($audit['http_links'], 0, 5) as $msg) echo "  - $msg\n";

echo "\nBroken Internal Anchor Links: " . count($audit['broken_anchor_links']) . "\n";
foreach(array_slice($audit['broken_anchor_links'], 0, 10) as $msg) echo "  - $msg\n";

echo "\nPages Missing Viewport Meta Tag: " . count($audit['missing_viewport']) . "\n";
?>
