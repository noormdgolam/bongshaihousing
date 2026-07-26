<?php
$files = glob("*.html");

foreach ($files as $file) {
    if (strpos($file, 'dv-') !== 0 && strpos($file, 'bh-tb-') !== 0) {
        continue;
    }
    
    $html = file_get_contents($file);
    
    // Fix the broken Quick Specs line:
    // From: <div style="font-size: 0.75rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Kitchen</div> Kitchens</div></div>
    // To: <div style="font-size: 0.75rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Kitchen</div><div id="spec-kitchen-101" style="font-weight: 700; color: var(--grey-900); font-size: 1.05rem;">2 Kitchens</div></div>
    
    // We need to extract the ID number from the file name, or just use regex to reconstruct
    preg_match('/(?:dv|bh-tb)-(\d+)/', $file, $matches);
    $id = $matches[1];
    
    $broken_quick_spec = '<div style="font-size: 0.75rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Kitchen</div> Kitchens</div></div>';
    $fixed_quick_spec = '<div style="font-size: 0.75rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Kitchen</div><div id="spec-kitchen-' . $id . '" style="font-weight: 700; color: var(--grey-900); font-size: 1.05rem;">2 Kitchens</div></div>';
    
    $html = str_replace($broken_quick_spec, $fixed_quick_spec, $html);
    
    // Now fix the JS allocation string:
    // From: <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;"><span style="color: var(--grey-700);"><span style="color:var(--accent);margin-right:8px;font-size:1.2rem;"> Kitchens</span></div>
    // To: <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;"><span style="color: var(--grey-700);"><span style="color:var(--accent);margin-right:8px;font-size:1.2rem;">▪</span>Kitchen</span><span style="font-weight: 700; color: var(--grey-900);">2 Kitchens</span></div>
    
    $broken_js_alloc = '<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;"><span style="color: var(--grey-700);"><span style="color:var(--accent);margin-right:8px;font-size:1.2rem;"> Kitchens</span></div>';
    $fixed_js_alloc = '<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;"><span style="color: var(--grey-700);"><span style="color:var(--accent);margin-right:8px;font-size:1.2rem;">▪</span>Kitchen</span><span style="font-weight: 700; color: var(--grey-900);">2 Kitchens</span></div>';
    
    $html = str_replace($broken_js_alloc, $fixed_js_alloc, $html);
    
    file_put_contents($file, $html);
    echo "Restored kitchen markup in $file\n";
}
?>
