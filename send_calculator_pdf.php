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
    $address = isset($_POST['address']) ? strip_tags(trim($_POST['address'])) : 'N/A';
    
    // Calculator Data
    $model = isset($_POST['model']) ? strip_tags(trim($_POST['model'])) : 'N/A';
    $area = isset($_POST['area']) ? strip_tags(trim($_POST['area'])) : 'N/A';
    $finish = isset($_POST['finish']) ? strip_tags(trim($_POST['finish'])) : 'N/A';
    
    $total_cost = isset($_POST['total_cost']) ? strip_tags(trim($_POST['total_cost'])) : '0';
    $down_payment = isset($_POST['down_payment']) ? strip_tags(trim($_POST['down_payment'])) : '0';
    $loan_amount = isset($_POST['loan_amount']) ? strip_tags(trim($_POST['loan_amount'])) : '0';
    $emi = isset($_POST['emi']) ? strip_tags(trim($_POST['emi'])) : '0';
    $tenure = isset($_POST['tenure']) ? strip_tags(trim($_POST['tenure'])) : '0';
    $rate = isset($_POST['rate']) ? strip_tags(trim($_POST['rate'])) : '0';

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
        $pdf->Cell(0, 10, 'Your Final Consultation & Quote', 0, 1, 'C');
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
        $pdf->Cell(50, 8, 'Address:', 0, 0);
        $pdf->Cell(0, 8, $address, 0, 1);
        $pdf->Ln(10);
        
        // Product Details
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->SetTextColor(0, 0, 0);
        $pdf->Cell(0, 10, 'Project Specification', 0, 1);
        $pdf->SetFont('Arial', '', 12);
        $pdf->SetTextColor(50, 50, 50);
        $pdf->Cell(50, 8, 'Selected Model:', 0, 0);
        $pdf->Cell(0, 8, $model, 0, 1);
        $pdf->Cell(50, 8, 'Floor Area:', 0, 0);
        $pdf->Cell(0, 8, $area, 0, 1);
        $pdf->Cell(50, 8, 'Finishing Quality:', 0, 0);
        $pdf->Cell(0, 8, $finish, 0, 1);
        $pdf->Ln(10);
        
        // Financial Details
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->SetTextColor(0, 0, 0);
        $pdf->Cell(0, 10, 'Financial Estimate (BDT)', 0, 1);
        $pdf->SetFont('Arial', '', 12);
        $pdf->SetTextColor(50, 50, 50);
        
        $pdf->Cell(60, 8, 'Estimated Total Cost:', 0, 0);
        $pdf->SetFont('Arial', 'B', 12);
        $pdf->Cell(0, 8, $total_cost, 0, 1);
        
        $pdf->SetFont('Arial', '', 12);
        $pdf->Cell(60, 8, 'Down Payment:', 0, 0);
        $pdf->Cell(0, 8, $down_payment, 0, 1);
        
        $pdf->Cell(60, 8, 'Loan Amount:', 0, 0);
        $pdf->Cell(0, 8, $loan_amount, 0, 1);
        
        $pdf->Cell(60, 8, 'Bank Interest Rate:', 0, 0);
        $pdf->Cell(0, 8, $rate . '%', 0, 1);
        
        $pdf->Cell(60, 8, 'Loan Tenure:', 0, 0);
        $pdf->Cell(0, 8, $tenure . ' Years', 0, 1);
        
        $pdf->Ln(5);
        $pdf->SetFont('Arial', 'B', 14);
        $pdf->SetTextColor(16, 185, 129); // Green color
        $pdf->Cell(60, 10, 'Estimated Monthly EMI:', 0, 0);
        $pdf->Cell(0, 10, $emi, 0, 1);
        
        $pdf->Ln(15);
        
        // Footer Note
        $pdf->SetFont('Arial', 'I', 10);
        $pdf->SetTextColor(150, 150, 150);
        $pdf->MultiCell(0, 6, '*This is a system-generated estimate based on user input and standard banking rates. Land price, utility connections, and registration fees are excluded. Please contact our sales team for a finalized quotation.');
        
        $pdfContent = $pdf->Output('S');
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to generate PDF. Error: " . $e->getMessage()]);
        exit;
    }

    $to = $email;
    $subject = 'Your Bongshai Housing Estimate & Quote';
    $boundary = md5(time());
    
    $headers = "From: sales@bongshaihousing.com\r\n";
    $headers .= "Bcc: sales@bongshai.com\r\n"; // Also send to admin
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";
    
    $body = "--$boundary\r\n";
    $body .= "Content-Type: text/plain; charset=ISO-8859-1\r\n";
    $body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $body .= "Hello $name,\r\n\r\n";
    $body .= "Thank you for planning your dream home with Bongshai Housing. Please find your detailed, personalized consultation PDF and cost breakdown attached.\r\n\r\n";
    $body .= "Our sales team will contact you shortly at $phone to discuss the next steps.\r\n\r\n";
    $body .= "Best regards,\r\nBongshai Housing Ltd.\r\n";
    
    $body .= "--$boundary\r\n";
    $body .= "Content-Type: application/pdf; name=\"Bongshai_Housing_Quote.pdf\"\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n";
    $body .= "Content-Disposition: attachment; filename=\"Bongshai_Housing_Quote.pdf\"\r\n\r\n";
    $body .= chunk_split(base64_encode($pdfContent)) . "\r\n";
    $body .= "--$boundary--";

    if (mail($to, $subject, $body, $headers)) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Email sent successfully!"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Email could not be sent. Please check server configuration."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed."]);
}
?>
