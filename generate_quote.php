<?php
require('fpdf.php');

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Check if FPDF is loaded
if (!class_exists('FPDF')) {
    echo json_encode(['success' => false, 'error' => 'FPDF library not loaded.']);
    exit;
}

// Ensure the request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method.']);
    exit;
}

// Get the JSON payload
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON data.']);
    exit;
}

// Sanitize inputs
$name = htmlspecialchars($data['name'] ?? 'Guest');
$phone = htmlspecialchars($data['phone'] ?? 'N/A');
$district = htmlspecialchars($data['district'] ?? 'N/A');
$upazila = htmlspecialchars($data['upazila'] ?? 'N/A');
$message = htmlspecialchars($data['message'] ?? 'No additional notes.');
$model = htmlspecialchars($data['model'] ?? 'Unknown Model');
$floor_area = htmlspecialchars($data['floor_area'] ?? 'N/A');
$bedrooms = htmlspecialchars($data['bedrooms'] ?? 'N/A');

// Create PDF
$pdf = new FPDF();
$pdf->AddPage();
$pdf->SetFont('Arial', 'B', 24);

// Title
$pdf->SetTextColor(30, 64, 175); // Brand Primary Color
$pdf->Cell(0, 15, 'BONGSHAI HOUSING', 0, 1, 'C');
$pdf->SetFont('Arial', 'I', 14);
$pdf->SetTextColor(100, 100, 100);
$pdf->Cell(0, 10, 'Official Quote Inquiry', 0, 1, 'C');
$pdf->Ln(10);

// Line
$pdf->SetDrawColor(200, 200, 200);
$pdf->Line(10, 40, 200, 40);
$pdf->Ln(5);

// Product Details Section
$pdf->SetFont('Arial', 'B', 16);
$pdf->SetTextColor(0, 0, 0);
$pdf->Cell(0, 10, 'Product Details', 0, 1);
$pdf->SetFont('Arial', '', 12);
$pdf->SetTextColor(50, 50, 50);
$pdf->Cell(50, 8, 'Model Name:', 0, 0);
$pdf->SetFont('Arial', 'B', 12);
$pdf->Cell(0, 8, $model, 0, 1);

$pdf->SetFont('Arial', '', 12);
$pdf->Cell(50, 8, 'Floor Area:', 0, 0);
$pdf->SetFont('Arial', 'B', 12);
$pdf->Cell(0, 8, $floor_area . ($floor_area === 'N/A' ? '' : ' Sq.Ft'), 0, 1);

$pdf->SetFont('Arial', '', 12);
$pdf->Cell(50, 8, 'Bedrooms:', 0, 0);
$pdf->SetFont('Arial', 'B', 12);
$pdf->Cell(0, 8, $bedrooms . ($bedrooms === 'N/A' ? '' : ' Bedrooms'), 0, 1);
$pdf->Ln(10);

// Customer Details Section
$pdf->SetFont('Arial', 'B', 16);
$pdf->SetTextColor(0, 0, 0);
$pdf->Cell(0, 10, 'Customer Information', 0, 1);

$pdf->SetFont('Arial', '', 12);
$pdf->SetTextColor(50, 50, 50);
$pdf->Cell(50, 8, 'Name:', 0, 0);
$pdf->Cell(0, 8, $name, 0, 1);

$pdf->Cell(50, 8, 'Phone:', 0, 0);
$pdf->Cell(0, 8, $phone, 0, 1);

$pdf->Cell(50, 8, 'District:', 0, 0);
$pdf->Cell(0, 8, $district, 0, 1);

$pdf->Cell(50, 8, 'Police Station:', 0, 0);
$pdf->Cell(0, 8, $upazila, 0, 1);
$pdf->Ln(10);

// Message Section
$pdf->SetFont('Arial', 'B', 16);
$pdf->SetTextColor(0, 0, 0);
$pdf->Cell(0, 10, 'Additional Notes', 0, 1);
$pdf->SetFont('Arial', '', 12);
$pdf->SetTextColor(50, 50, 50);
$pdf->MultiCell(0, 8, $message);
$pdf->Ln(20);

// Footer
$pdf->SetFont('Arial', 'I', 10);
$pdf->SetTextColor(150, 150, 150);
$pdf->Cell(0, 10, 'Generated automatically from bongshaihousing.com on ' . date('Y-m-d H:i:s'), 0, 1, 'C');

// Generate unique filename
$filename = 'quote-' . time() . '-' . rand(1000, 9999) . '.pdf';
$filepath = __DIR__ . '/quotes/' . $filename;

// Ensure quotes directory exists
if (!is_dir(__DIR__ . '/quotes/')) {
    mkdir(__DIR__ . '/quotes/', 0777, true);
}

// Output PDF to file
$pdf->Output('F', $filepath);

// Get the base URL
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$domainName = $_SERVER['HTTP_HOST'];
$pdf_url = $protocol . $domainName . '/quotes/' . $filename;

echo json_encode([
    'success' => true,
    'pdf_url' => $pdf_url
]);
?>
