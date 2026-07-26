<?php
$files = glob("bh-dv-*.html");

foreach ($files as $file) {
    $html = file_get_contents($file);
    
    // We are looking for the Quick-Specs Bar outer div and its contents.
    $pattern = '/(<div class="reveal-up" style="display: flex; flex-wrap: wrap; gap: var\(--space-4\); background: var\(--off-white\); padding: var\(--space-6\); border-radius: 16px; box-shadow: inset 0 2px 4px rgba\(0,0,0,0\.02\); margin-bottom: var\(--space-8\); justify-content: space-around; border: 1px solid var\(--grey-200\);">)\s*<div style="display: flex; align-items: center; gap: 12px;">\s*<span style="font-size: 1\.5rem;">📐<\/span>\s*<div>\s*<div[^>]*>Floor Area<\/div>\s*(<div class="area-selector" id="area-selector-[^"]+">.*?<\/div>)\s*<\/div>\s*<\/div>\s*<div style="width: 1px; background: var\(--grey-300\);"><\/div>\s*(<div style="display: flex; align-items: center; gap: 12px;">\s*<span style="font-size: 1\.5rem;">🛏️.*?<\/div>\s*<\/div>)\s*<div style="width: 1px; background: var\(--grey-300\);"><\/div>\s*(<div style="display: flex; align-items: center; gap: 12px;">\s*<span style="font-size: 1\.5rem;">🚿.*?<\/div>\s*<\/div>)\s*<div style="width: 1px; background: var\(--grey-300\);"><\/div>\s*(<div style="display: flex; align-items: center; gap: 12px;">\s*<span style="font-size: 1\.5rem;">🍳.*?<\/div>\s*<\/div>)\s*<\/div>/is';

    $new_html = preg_replace_callback($pattern, function($matches) {
        $area_selector_html = $matches[2];
        $bed_html = $matches[3];
        $bath_html = $matches[4];
        $kitchen_html = $matches[5];
        
        return <<<HTML
<div class="reveal-up" style="display: flex; flex-direction: column; gap: var(--space-5); background: var(--off-white); padding: var(--space-6); border-radius: 16px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); margin-bottom: var(--space-8); border: 1px solid var(--grey-200);">
  
  <!-- Row 1: Floor Area Selector -->
  <div style="display: flex; align-items: flex-start; gap: 12px; border-bottom: 1px solid var(--grey-200); padding-bottom: var(--space-4);">
    <span style="font-size: 1.5rem; margin-top: 4px;">📐</span>
    <div style="flex: 1;">
      <div style="font-size: 0.75rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px;">Select Floor Area</div>
      $area_selector_html
    </div>
  </div>
  
  <!-- Row 2: Secondary Specs -->
  <div style="display: flex; flex-wrap: wrap; gap: var(--space-4); justify-content: space-around;">
    $bed_html
    <div style="width: 1px; background: var(--grey-200);"></div>
    $bath_html
    <div style="width: 1px; background: var(--grey-200);"></div>
    $kitchen_html
  </div>
</div>
HTML;
    }, $html);
    
    if ($new_html !== $html) {
        file_put_contents($file, $new_html);
        echo "Updated layout in $file\n";
    }
}
?>
