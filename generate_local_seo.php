<?php
$html = file_get_contents('index.html');

$locations = [
    [
        'slug' => 'steel-building-dhaka.html',
        'city' => 'Dhaka',
        'title' => 'Steel Building Company in Dhaka',
        'hero' => 'Top Steel Building Company in <span class="highlight">Dhaka</span>',
        'keywords' => 'steel building Dhaka, prefab housing Dhaka, EPC contractor Dhaka, container house Dhaka'
    ],
    [
        'slug' => 'steel-building-chotrogram.html',
        'city' => 'Chattogram',
        'title' => 'Steel Building Company in Chattogram',
        'hero' => 'Top Steel Building Company in <span class="highlight">Chattogram</span>',
        'keywords' => 'steel building Chotrogram, prefab housing Chittagong, EPC contractor Chattogram, warehouse Chattogram'
    ],
    [
        'slug' => 'steel-building-gazipur.html',
        'city' => 'Gazipur',
        'title' => 'Steel Building Company in Gazipur',
        'hero' => 'Top Steel Building Company in <span class="highlight">Gazipur</span>',
        'keywords' => 'steel building Gazipur, prefab housing Gazipur, EPC contractor Gazipur, resort Gazipur'
    ],
    [
        'slug' => 'prefab-housing-cumilla.html',
        'city' => 'Cumilla',
        'title' => 'Prefab Housing & Steel Buildings in Cumilla',
        'hero' => 'Premier Prefab Housing in <span class="highlight">Cumilla</span>',
        'keywords' => 'prefab housing Cumilla, steel building Cumilla, cottage Cumilla, PEB Cumilla'
    ],
    [
        'slug' => 'prefab-cottage-bogra-rangpur.html',
        'city' => 'Bogra & Rangpur',
        'title' => 'Prefab Cottage & Steel Buildings in Bogra & Rangpur',
        'hero' => 'Premier Prefab Housing in <span class="highlight">Bogra & Rangpur</span>',
        'keywords' => 'prefab cottage Bogra, steel building Rangpur, EPC contractor North Bengal, cottage Bogra'
    ]
];

foreach ($locations as $loc) {
    $temp = $html;
    
    // Replace title
    $temp = preg_replace('/<title>.*?<\/title>/', "<title>{$loc['title']} | Bongshai Housing</title>", $temp);
    
    // Replace og:title
    $temp = preg_replace('/<meta property="og:title" content=".*?" \/>/', '<meta property="og:title" content="'.$loc['title'].' | Bongshai Housing" />', $temp);
    
    // Replace twitter:title
    $temp = preg_replace('/<meta name="twitter:title" content=".*?" \/>/', '<meta name="twitter:title" content="'.$loc['title'].' | Bongshai Housing" />', $temp);
    
    // Replace DC.title
    $temp = preg_replace('/<meta name="DC.title" content=".*?" \/>/', '<meta name="DC.title" content="'.$loc['title'].' – Bongshai Housing" />', $temp);
    
    // Replace canonical URL
    $temp = preg_replace('/<link rel="canonical" href="https:\/\/bongshaihousing.com\/" \/>/', '<link rel="canonical" href="https://bongshaihousing.com/'.$loc['slug'].'" />', $temp);

    // Replace keywords
    $temp = preg_replace('/<meta name="keywords" content=".*?Pre-Engineered.*?" \/>/', '<meta name="keywords" content="'.$loc['keywords'].'" />', $temp);

    // Replace Hero Title using Regex to be safe with line breaks
    $temp = preg_replace('/Premier <span class="highlight">Steel Building<\/span><br>\s*&amp; Prefab Housing/m', $loc['hero'], $temp);
    $temp = preg_replace('/Premier <span class="highlight">Steel Building<\/span><br>\s*& Prefab Housing/m', $loc['hero'], $temp);
    
    // Ensure "Bangladesh's Premier Housing Developer" mentions the city
    $temp = preg_replace('/Bangladesh\'s Premier Housing Developer/', $loc['city'].'\'s Premier Housing Developer', $temp);

    file_put_contents($loc['slug'], $temp);
    echo "Created " . $loc['slug'] . "\n";
}
?>
