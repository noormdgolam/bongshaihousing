<?php
$files = glob("*.html");

foreach ($files as $file) {
    $html = file_get_contents($file);
    $changed = false;
    
    // Remove the 1800 button
    $pattern_button = '/\s*<button type="button" class="area-btn\s*" onclick="selectArea\(\'[^\']+\', \'1800\', this\)">1800 Sq\.Ft<\/button>/i';
    $new_html = preg_replace($pattern_button, '', $html);
    if ($new_html !== $html) { $html = $new_html; $changed = true; }
    
    // Remove the 1800 json data
    // It could have a trailing comma, or a leading comma
    // e.g. ,"1800": { ... }
    $pattern_json1 = '/,\s*"1800":\s*\{\s*bed:\s*"[^"]*",\s*bath:\s*"[^"]*",\s*dining:\s*"[^"]*",\s*drawing:\s*"[^"]*"\s*\}/i';
    $new_html = preg_replace($pattern_json1, '', $html);
    if ($new_html !== $html) { $html = $new_html; $changed = true; }
    
    // Fallback if no leading comma but trailing comma
    $pattern_json2 = '/"1800":\s*\{\s*bed:\s*"[^"]*",\s*bath:\s*"[^"]*",\s*dining:\s*"[^"]*",\s*drawing:\s*"[^"]*"\s*\},\s*/i';
    $new_html = preg_replace($pattern_json2, '', $html);
    if ($new_html !== $html) { $html = $new_html; $changed = true; }
    
    // Fallback if no commas at all
    $pattern_json3 = '/"1800":\s*\{\s*bed:\s*"[^"]*",\s*bath:\s*"[^"]*",\s*dining:\s*"[^"]*",\s*drawing:\s*"[^"]*"\s*\}/i';
    $new_html = preg_replace($pattern_json3, '', $html);
    if ($new_html !== $html) { $html = $new_html; $changed = true; }
    
    // Remove the 1800 option tag
    $pattern_option = '/\s*<option value="1800">1800 Sq\.Ft<\/option>/i';
    $new_html = preg_replace($pattern_option, '', $html);
    if ($new_html !== $html) { $html = $new_html; $changed = true; }
    
    if ($changed) {
        file_put_contents($file, $html);
        echo "Removed 1800sqft from $file\n";
    }
}
?>
