<?php
$files = glob("bh-tb-*.html");

$floorDataMap = [
    "440" => '{ bed: "4 Rooms", bath: "2 Rooms", dining: "2 Spaces", drawing: "N/A" }',
    "550" => '{ bed: "4 Rooms", bath: "2 Rooms", dining: "2 Spaces", drawing: "N/A" }',
    "750" => '{ bed: "4 Rooms", bath: "4 Rooms", dining: "2 Spaces", drawing: "2 Rooms" }',
    "950" => '{ bed: "6 Rooms", bath: "4 Rooms", dining: "2 Spaces", drawing: "2 Rooms" }',
    "1200" => '{ bed: "8 Rooms", bath: "6 Rooms", dining: "2 Spaces", drawing: "2 Rooms" }',
    "1500" => '{ bed: "8 Rooms", bath: "8 Rooms", dining: "2 Spaces", drawing: "2 Rooms" }',
    "1800" => '{ bed: "10 Rooms", bath: "10 Rooms", dining: "2 Spaces", drawing: "2 Rooms" }'
];

foreach ($files as $file) {
    $html = file_get_contents($file);
    
    // Replace JSON data for bh-tb files
    foreach ($floorDataMap as $key => $val) {
        $pattern = '/"' . $key . '":\s*\{[^\}]+\}/';
        $html = preg_replace($pattern, '"' . $key . '": ' . $val, $html);
    }
    
    // Replace Kitchen Quick Specs
    $html = preg_replace('/(<div[^>]+id="spec-kitchen-[^"]+"[^>]*>)Included(<\/div>)/i', '$12 Kitchens$2', $html);
    
    // Replace Kitchen Space Allocation in JS
    $html = preg_replace('/(▪<\/span>Kitchen<\/span><span[^>]*>)Included(<\/span><\/div>)/i', '$12 Kitchens$2', $html);
    
    file_put_contents($file, $html);
    echo "Fixed bh-tb file: $file\n";
}

// Now do dv- files for Kitchen ONLY
$dv_files = glob("dv-*.html");
foreach ($dv_files as $file) {
    $html = file_get_contents($file);
    
    // Replace Kitchen Quick Specs
    $html = preg_replace('/(<div[^>]+id="spec-kitchen-[^"]+"[^>]*>)Included(<\/div>)/i', '$12 Kitchens$2', $html);
    
    // Replace Kitchen Space Allocation in JS
    $html = preg_replace('/(▪<\/span>Kitchen<\/span><span[^>]*>)Included(<\/span><\/div>)/i', '$12 Kitchens$2', $html);
    
    file_put_contents($file, $html);
    echo "Fixed dv file kitchen: $file\n";
}
?>
