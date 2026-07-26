<?php
$files = glob("*.html");

foreach ($files as $file) {
    if (strpos($file, 'dv-') !== 0 && strpos($file, 'bh-tb-') !== 0) {
        continue; // Only duplex and two-story
    }
    
    $html = file_get_contents($file);
    
    $changed = false;
    
    // Find all floorData JSON objects
    $pattern = '/"(\d+x2)":\s*\{\s*bed:\s*"([^"]+)",\s*bath:\s*"([^"]+)",\s*dining:\s*"([^"]+)",\s*drawing:\s*"([^"]+)"\s*\}/';
    
    $new_html = preg_replace_callback($pattern, function($m) {
        $key = $m[1];
        $bed = $m[2];
        $bath = $m[3];
        $dining = $m[4];
        $drawing = $m[5];
        
        // Double dining
        if (strpos($dining, '1 Space') !== false) {
            $dining = str_replace('1 Space', '2 Spaces', $dining);
        } elseif (strpos($dining, '1') !== false) {
            $dining = str_replace('1', '2', $dining);
            $dining = str_replace('Space', 'Spaces', $dining);
        }
        
        // Double drawing
        if (strpos($drawing, '1 Room') !== false) {
            $drawing = str_replace('1 Room', '2 Rooms', $drawing);
        } elseif (strpos($drawing, '1') !== false) {
            $drawing = str_replace('1', '2', $drawing);
            $drawing = str_replace('Room', 'Rooms', $drawing);
        }
        
        return "\"$key\": { bed: \"$bed\", bath: \"$bath\", dining: \"$dining\", drawing: \"$drawing\" }";
        
    }, $html);
    
    if ($new_html !== $html) {
        file_put_contents($file, $new_html);
        echo "Doubled dining/drawing for duplex in $file\n";
    }
}
?>
