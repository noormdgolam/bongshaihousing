<?php
$html = file_get_contents('index.html');

$replacements = [
    'src="images/hero-bg.png"' => 'src="images/projects/completed/wave_resort_01.jpeg"',
    'src="images/about-team.png"' => 'src="images/projects/completed/chotrogram_1784362457177.png"',
    'src="images/low-cost-cottage.png"' => 'src="images/projects/completed/daudkandi_cumilla_1784362527182.png"',
    'src="images/luxury-villa.png"' => 'src="images/projects/completed/razabari_gazipur_1784362716498.png"',
    'src="images/single-story-building.png"' => 'src="images/projects/completed/vanga_faridpur.jpg"'
];

$html = str_replace(array_keys($replacements), array_values($replacements), $html);

file_put_contents('index.html', $html);
echo "Images updated in index.html\n";
?>
