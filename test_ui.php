<?php
$html = file_get_contents('lcv-109.html');

// 1. Update JSON data
$html = preg_replace('/"950":\s*\{\s*bed:\s*"[^"]*",/', '"950": { bed: "3 Rooms",', $html);
$html = preg_replace('/"1200":\s*\{\s*bed:\s*"[^"]*",/', '"1200": { bed: "4 Rooms",', $html);

// 2. Replace Select with Modern Box
$pattern = '/<select id="floorAreaSelect-([a-zA-Z0-9-]+)"[^>]*>(.*?)<\/select>/s';

$html = preg_replace_callback($pattern, function($matches) {
    $id = $matches[1];
    $options_html = $matches[2];
    
    // Parse options
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
  
  // Try to call the specific update function if it exists
  const funcName = 'updateSpecs' + id.replace('-', ''); // Sometimes id is 109, sometimes maybe something else.
  if (typeof window[funcName] === 'function') {
      window[funcName](sqft);
  } else if (typeof window['updateSpecs' + id] === 'function') {
      window['updateSpecs' + id](sqft);
  }
}
</script>
HTML;

    $html = str_replace('</body>', $script_and_styles . "\n</body>", $html);
}

file_put_contents('lcv-109-test.html', $html);
echo "Tested on lcv-109.html\n";
?>
