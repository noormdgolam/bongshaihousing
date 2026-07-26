<?php
$directory = 'c:\Users\Maria\Documents\WEB\BONGSHAI HOUSING';
$html_files = glob($directory . '\*.html');

$audit = [
    'missing_lazy' => 0,
    'missing_title' => 0,
    'missing_dimensions' => 0,
    'total_images' => 0
];

foreach ($html_files as $file) {
    $content = file_get_contents($file);
    preg_match_all('/<img([^>]*)>/is', $content, $img_matches);
    
    foreach ($img_matches[1] as $img) {
        $audit['total_images']++;
        if (stripos($img, 'loading="lazy"') === false) $audit['missing_lazy']++;
        if (stripos($img, 'title=') === false) $audit['missing_title']++;
        if (stripos($img, 'width=') === false || stripos($img, 'height=') === false) $audit['missing_dimensions']++;
    }
}

echo "Total Images found in HTML: " . $audit['total_images'] . "\n";
echo "Images missing loading=\"lazy\": " . $audit['missing_lazy'] . "\n";
echo "Images missing title attribute: " . $audit['missing_title'] . "\n";
echo "Images missing width/height attributes: " . $audit['missing_dimensions'] . "\n";
?>
