<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json; charset=UTF-8");

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display to user, but log it

require('fpdf.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if the input is JSON or standard Form-Data
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
    
    if (strpos($contentType, 'application/json') !== false) {
        $content = trim(file_get_contents("php://input"));
        $decoded = json_decode($content, true);
        $_POST = $decoded;
    }

    $fname = isset($_POST['fname']) ? strip_tags(trim($_POST['fname'])) : '';
    $lname = isset($_POST['lname']) ? strip_tags(trim($_POST['lname'])) : '';
    $email = isset($_POST['email']) ? filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL) : '';
    $phone = isset($_POST['phone']) ? strip_tags(trim($_POST['phone'])) : '';
    $package = isset($_POST['package']) ? strip_tags(trim($_POST['package'])) : '';
    $budget = isset($_POST['budget']) ? strip_tags(trim($_POST['budget'])) : '';
    $message = isset($_POST['message']) ? strip_tags(trim($_POST['message'])) : '';

    if (empty($fname) || empty($lname) || empty($email) || empty($phone) || empty($message)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Please fill in all required fields."]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid email format."]);
        exit;
    }

    // Create PDF
    try {
        $pdf = new FPDF();
        $pdf->AddPage();
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->Cell(0, 10, 'Bongshai Housing - New Inquiry', 0, 1, 'C');
        $pdf->Ln(10);
        
        $pdf->SetFont('Arial', '', 12);
        $pdf->Cell(50, 10, 'First Name:');
        $pdf->Cell(0, 10, $fname, 0, 1);
        
        $pdf->Cell(50, 10, 'Last Name:');
        $pdf->Cell(0, 10, $lname, 0, 1);
        
        $pdf->Cell(50, 10, 'Email:');
        $pdf->Cell(0, 10, $email, 0, 1);
        
        $pdf->Cell(50, 10, 'Phone / WhatsApp:');
        $pdf->Cell(0, 10, $phone, 0, 1);
        
        $pdf->Cell(50, 10, 'Package of Interest:');
        $pdf->Cell(0, 10, $package, 0, 1);
        
        $pdf->Cell(50, 10, 'Approximate Budget:');
        $pdf->Cell(0, 10, $budget, 0, 1);
        
        $pdf->Ln(5);
        $pdf->Cell(0, 10, 'Message / Requirements:');
        $pdf->Ln(10);
        $pdf->MultiCell(0, 10, $message);
        
        $pdfContent = $pdf->Output('S');
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to generate PDF. Error: " . $e->getMessage()]);
        exit;
    }

    // Email logic
    $to = 'sales@bongshai.com';
    $subject = 'New Quote Request from ' . $fname . ' ' . $lname;
    
    $boundary = md5(time());
    
    $headers = "From: no-reply@bongshaihousing.com\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";
    
    // Message Body
    $body = "--$boundary\r\n";
    $body .= "Content-Type: text/plain; charset=ISO-8859-1\r\n";
    $body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $body .= "You have received a new inquiry from your website contact form. Please find the details attached as a PDF.\r\n\r\n";
    $body .= "Name: $fname $lname\r\n";
    $body .= "Email: $email\r\n";
    $body .= "Phone: $phone\r\n";
    $body .= "\r\n";
    
    // Attachment
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
