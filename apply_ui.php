<?php
// 1. Revert index.html hero bg
$index_html = file_get_contents('index.html');
$index_html = str_replace('src="images/projects/completed/wave_resort_01.jpeg"', 'src="images/hero-bg.png"', $index_html);
file_put_contents('index.html', $index_html);
echo "Reverted hero bg in index.html\n";

// 2. Update UI across all product HTML files
$files = glob("*.html");

$script_and_styles = <<<HTML
<style>
.area-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.area-btn {
  background: var(--white);
  border: 1px solid var(--grey-300);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--grey-700);
  cursor: pointer;
  transition: all 0.2s ease;
}
.area-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--off-white);
}
.area-btn.active {
  background: var(--primary);
  color: var(--white);
  border-color: var(--primary);
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
</style>
<script>
function selectArea(id, sqft, btn) {
  const container = btn.parentElement;
  const buttons = container.querySelectorAll('.area-btn');
  buttons.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  const funcName = 'updateSpecs' + id.replace('-', '');
  if (typeof window[funcName] === 'function') {
      window[funcName](sqft);
  } else if (typeof window['updateSpecs' + id] === 'function') {
      window['updateSpecs' + id](sqft);
  }
}
</script>
HTML;

foreach ($files as $file) {
    if ($file === 'index.html' || $file === 'lcv-109-test.html') continue;
    
    $html = file_get_contents($file);
    $changed = false;
    
    // Update JSON data for single story/low cost villas
    $new_html = preg_replace('/"950":\s*\{\s*bed:\s*"[^"]*",/', '"950": { bed: "3 Rooms",', $html);
    if ($new_html !== $html) { $html = $new_html; $changed = true; }
    
    $new_html = preg_replace('/"1200":\s*\{\s*bed:\s*"[^"]*",/', '"1200": { bed: "4 Rooms",', $html);
    if ($new_html !== $html) { $html = $new_html; $changed = true; }
    
    // Replace Select with Modern Box
    $pattern = '/<select id="floorAreaSelect-([a-zA-Z0-9-]+)"[^>]*>(.*?)<\/select>/s';
    if (preg_match($pattern, $html)) {
        $html = preg_replace_callback($pattern, function($matches) {
            $id = $matches[1];
            $options_html = $matches[2];
            
            preg_match_all('/<option value="([^"]+)">([^<]+)<\/option>/', $options_html, $opt_matches, PREG_SET_ORDER);
            
            $buttons = [];
            $isFirst = true;
            foreach ($opt_matches as $opt) {
                $val = $opt[1];
                $text = $opt[2];
                $activeClass = $isFirst ? 'active' : '';
                $isFirst = false;
                
                $buttons[] = "<button type=\"button\" class=\"area-btn $activeClass\" onclick=\"selectArea('$id', '$val', this)\">$text</button>";
            }
            
            $buttons_str = implode("\n", $buttons);
            
            return <<<HTML
<div class="area-selector" id="area-selector-$id">
$buttons_str
</div>
HTML;
        }, $html);
        
        // Append the script and styles if not already there
        if (strpos($html, 'function selectArea') === false) {
            $html = str_replace('</body>', $script_and_styles . "\n</body>", $html);
        }
        
        $changed = true;
    }
    
    if ($changed) {
        file_put_contents($file, $html);
        echo "Updated UI in $file\n";
    }
}
?>
