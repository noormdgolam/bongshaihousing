<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set('display_errors', 0); 

require('fpdf.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
    
    if (strpos($contentType, 'application/json') !== false) {
        $content = trim(file_get_contents("php://input"));
        $decoded = json_decode($content, true);
        $_POST = $decoded;
    }

    $name = isset($_POST['name']) ? strip_tags(trim($_POST['name'])) : '';
    $email = isset($_POST['email']) ? filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL) : '';
    $phone = isset($_POST['phone']) ? strip_tags(trim($_POST['phone'])) : '';
    $district = isset($_POST['district']) ? strip_tags(trim($_POST['district'])) : 'N/A';
    $upazila = isset($_POST['upazila']) ? strip_tags(trim($_POST['upazila'])) : 'N/A';
    $model = isset($_POST['model']) ? strip_tags(trim($_POST['model'])) : 'N/A';
    $floor_area = isset($_POST['floor_area']) ? strip_tags(trim($_POST['floor_area'])) : 'N/A';
    $bedrooms = isset($_POST['bedrooms']) ? strip_tags(trim($_POST['bedrooms'])) : 'N/A';
    $message = isset($_POST['message']) ? strip_tags(trim($_POST['message'])) : 'No additional notes.';

    if (empty($name) || empty($email) || empty($phone)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Please fill in all required fields."]);
        exit;
    }

    // Create PDF
    try {
        $pdf = new FPDF();
        $pdf->AddPage();
        
        $pdf->SetFont('Arial', 'B', 24);
        $pdf->SetTextColor(30, 64, 175);
        $pdf->Cell(0, 15, 'BONGSHAI HOUSING', 0, 1, 'C');
        $pdf->SetFont('Arial', 'I', 14);
        $pdf->SetTextColor(100, 100, 100);
        $pdf->Cell(0, 10, 'Internal Quote Request details', 0, 1, 'C');
        $pdf->Ln(10);
        
        $pdf->SetDrawColor(200, 200, 200);
        $pdf->Line(10, 40, 200, 40);
        $pdf->Ln(5);
        
        // Customer Details
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->SetTextColor(0, 0, 0);
        $pdf->Cell(0, 10, 'Customer Information', 0, 1);
        $pdf->SetFont('Arial', '', 12);
        $pdf->SetTextColor(50, 50, 50);
        $pdf->Cell(50, 8, 'Name:', 0, 0);
        $pdf->Cell(0, 8, $name, 0, 1);
        $pdf->Cell(50, 8, 'Email:', 0, 0);
        $pdf->Cell(0, 8, $email, 0, 1);
        $pdf->Cell(50, 8, 'Phone:', 0, 0);
        $pdf->Cell(0, 8, $phone, 0, 1);
        $pdf->Cell(50, 8, 'Location:', 0, 0);
        $pdf->Cell(0, 8, $upazila . ', ' . $district, 0, 1);
        $pdf->Ln(10);
        
        // Product Details
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->SetTextColor(0, 0, 0);
        $pdf->Cell(0, 10, 'Product Details', 0, 1);
        $pdf->SetFont('Arial', '', 12);
        $pdf->SetTextColor(50, 50, 50);
        $pdf->Cell(50, 8, 'Model:', 0, 0);
        $pdf->Cell(0, 8, $model, 0, 1);
        $pdf->Cell(50, 8, 'Floor Area:', 0, 0);
        $pdf->Cell(0, 8, $floor_area . ($floor_area !== 'N/A' ? ' Sq.Ft' : ''), 0, 1);
        $pdf->Cell(50, 8, 'Bedrooms:', 0, 0);
        $pdf->Cell(0, 8, $bedrooms, 0, 1);
        $pdf->Ln(10);
        
        // Message
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->SetTextColor(0, 0, 0);
        $pdf->Cell(0, 10, 'Additional Notes', 0, 1);
        $pdf->SetFont('Arial', '', 12);
        $pdf->SetTextColor(50, 50, 50);
        $pdf->MultiCell(0, 8, $message);
        
        $pdfContent = $pdf->Output('S');
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to generate PDF. Error: " . $e->getMessage()]);
        exit;
    }

    $to = 'sales@bongshai.com';
    $subject = 'New Quote Request from ' . $name;
    $boundary = md5(time());
    
    $headers = "From: no-reply@bongshaihousing.com\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";
    
    $body = "--$boundary\r\n";
    $body .= "Content-Type: text/plain; charset=ISO-8859-1\r\n";
    $body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $body .= "You have received a new inquiry from your website contact form. Please find the detailed Quote Request attached as a PDF.\r\n\r\n";
    $body .= "Name: $name\r\n";
    $body .= "Email: $email\r\n";
    $body .= "Phone: $phone\r\n";
    $body .= "Model: $model\r\n";
    $body .= "\r\n";
    
    $body .= "--$boundary\r\n";
    $body .= "Content-Type: application/pdf; name=\"Inquiry_Details.pdf\"\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n";
    $body .= "Content-Disposition: attachment; filename=\"Inquiry_Details.pdf\"\r\n\r\n";
    $body .= chunk_split(base64_encode($pdfContent)) . "\r\n";
    $body .= "--$boundary--";

    if (mail($to, $subject, $body, $headers)) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Message sent successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Message could not be sent. Please check your mail server configuration."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed."]);
}
?>