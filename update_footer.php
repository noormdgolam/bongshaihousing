<?php
$replacement = <<<HTML
        <!-- Service Areas -->
        <div>
          <h3 class="footer-col-title">Service Areas</h3>
          <nav class="footer-links" aria-label="Service Areas">
            <a href="steel-building-dhaka.html" class="footer-link">Dhaka &amp; Probachol</a>
            <a href="steel-building-chotrogram.html" class="footer-link">Chattogram</a>
            <a href="steel-building-gazipur.html" class="footer-link">Gazipur</a>
            <a href="prefab-housing-cumilla.html" class="footer-link">Cumilla</a>
            <a href="prefab-cottage-bogra-rangpur.html" class="footer-link">Bogra &amp; Rangpur</a>
          </nav>
        </div>
HTML;

$files = glob("*.html");

foreach ($files as $file) {
    $content = file_get_contents($file);
    
    // Match the entire "Housing Packages" div
    // We optionally match a preceding HTML comment like <!-- Properties -->
    $pattern = '/(?:<!--\s*Properties\s*-->\s*)?<div>\s*<h3 class="footer-col-title">Housing Packages<\/h3>\s*<nav class="footer-links.*?>.*?<\/nav>\s*<\/div>/s';
    
    if (preg_match($pattern, $content)) {
        $content = preg_replace($pattern, $replacement, $content);
        file_put_contents($file, $content);
        echo "Updated footer in $file\n";
    }
}
?>
