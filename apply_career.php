<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(E_ALL);
ini_set('display_errors', 0); 

require('fpdf.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    $fname = isset($_POST['fname']) ? strip_tags(trim($_POST['fname'])) : '';
    $lname = isset($_POST['lname']) ? strip_tags(trim($_POST['lname'])) : '';
    $email = isset($_POST['email']) ? filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL) : '';
    $phone = isset($_POST['phone']) ? strip_tags(trim($_POST['phone'])) : '';
    $position = isset($_POST['position']) ? strip_tags(trim($_POST['position'])) : '';
    $experience = isset($_POST['experience']) ? strip_tags(trim($_POST['experience'])) : '';
    $cover = isset($_POST['cover']) ? strip_tags(trim($_POST['cover'])) : 'N/A';
    
    if (empty($fname) || empty($lname) || empty($email) || empty($phone) || empty($position)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Please fill in all required fields."]);
        exit;
    }
    
    // Check CV Upload
    if (!isset($_FILES['cv']) || $_FILES['cv']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Please upload a valid CV."]);
        exit;
    }
    
    $cvFile = $_FILES['cv'];
    $cvMime = mime_content_type($cvFile['tmp_name']);
    $cvExt = strtolower(pathinfo($cvFile['name'], PATHINFO_EXTENSION));
    
    if ($cvExt !== 'pdf' || $cvMime !== 'application/pdf') {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Only PDF files are allowed for CV."]);
        exit;
    }
    
    $cvContent = file_get_contents($cvFile['tmp_name']);
    $safeName = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $cvFile['name']);

    // Create Application Summary PDF
    try {
        $pdf = new FPDF();
        $pdf->AddPage();
        
        $pdf->SetFont('Arial', 'B', 24);
        $pdf->SetTextColor(30, 64, 175);
        $pdf->Cell(0, 15, 'BONGSHAI HOUSING', 0, 1, 'C');
        $pdf->SetFont('Arial', 'I', 14);
        $pdf->SetTextColor(100, 100, 100);
        $pdf->Cell(0, 10, 'Job Application Summary', 0, 1, 'C');
        $pdf->Ln(10);
        
        $pdf->SetDrawColor(200, 200, 200);
        $pdf->Line(10, 40, 200, 40);
        $pdf->Ln(5);
        
        // Applicant Details
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->SetTextColor(0, 0, 0);
        $pdf->Cell(0, 10, 'Applicant Information', 0, 1);
        $pdf->SetFont('Arial', '', 12);
        $pdf->SetTextColor(50, 50, 50);
        
        $pdf->Cell(50, 8, 'Full Name:', 0, 0);
        $pdf->Cell(0, 8, $fname . ' ' . $lname, 0, 1);
        $pdf->Cell(50, 8, 'Email:', 0, 0);
        $pdf->Cell(0, 8, $email, 0, 1);
        $pdf->Cell(50, 8, 'Phone:', 0, 0);
        $pdf->Cell(0, 8, $phone, 0, 1);
        $pdf->Ln(5);
        
        // Application Details
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->SetTextColor(0, 0, 0);
        $pdf->Cell(0, 10, 'Role Details', 0, 1);
        $pdf->SetFont('Arial', '', 12);
        $pdf->SetTextColor(50, 50, 50);
        
        // Map position values to readable names if needed
        $positions = [
            'dgm' => 'Deputy General Manager (DGM)',
            'pm' => 'Project Manager',
            'architect' => 'Architect',
            'marketing' => 'Executive - Marketing & Sales',
            'qc' => 'Quality Control (QC) Engineer',
            'tender' => 'Tender Executive',
            'site-eng' => 'Site Engineer',
            'foreman' => 'Foreman (Civil Construction)',
            'other' => 'Other'
        ];
        $positionName = isset($positions[$position]) ? $positions[$position] : $position;
        
        $pdf->Cell(50, 8, 'Position Applied:', 0, 0);
        $pdf->Cell(0, 8, $positionName, 0, 1);
        $pdf->Cell(50, 8, 'Experience:', 0, 0);
        $pdf->Cell(0, 8, $experience . ' Years', 0, 1);
        $pdf->Ln(5);
        
        // Cover Letter
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->SetTextColor(0, 0, 0);
        $pdf->Cell(0, 10, 'Cover Letter', 0, 1);
        $pdf->SetFont('Arial', '', 12);
        $pdf->SetTextColor(50, 50, 50);
        $pdf->MultiCell(0, 6, $cover);
        
        $summaryPdfContent = $pdf->Output('S');
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to generate summary PDF."]);
        exit;
    }

    $to = "jobs@bongshai.com";
    $subject = "New Job Application: " . $fname . " " . $lname . " - " . $positionName;
    $boundary = md5(time());
    
    $headers = "From: no-reply@bongshaihousing.com\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";
    
    // Body Text
    $body = "--$boundary\r\n";
    $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $body .= "A new job application has been submitted via Bongshai Housing website.\r\n\r\n";
    $body .= "Name: $fname $lname\r\n";
    $body .= "Email: $email\r\n";
    $body .= "Phone: $phone\r\n";
    $body .= "Position: $positionName\r\n";
    $body .= "Experience: $experience Years\r\n\r\n";
    $body .= "Please find the application summary and the applicant's CV attached.\r\n\r\n";
    
    // Attachment 1: Summary PDF
    $body .= "--$boundary\r\n";
    $body .= "Content-Type: application/pdf; name=\"Application_Summary_$fname.pdf\"\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n";
    $body .= "Content-Disposition: attachment; filename=\"Application_Summary_$fname.pdf\"\r\n\r\n";
    $body .= chunk_split(base64_encode($summaryPdfContent)) . "\r\n";
    
    // Attachment 2: Uploaded CV PDF
    $body .= "--$boundary\r\n";
    $body .= "Content-Type: application/pdf; name=\"$safeName\"\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n";
    $body .= "Content-Disposition: attachment; filename=\"$safeName\"\r\n\r\n";
    $body .= chunk_split(base64_encode($cvContent)) . "\r\n";
    
    $body .= "--$boundary--";

    if (mail($to, $subject, $body, $headers)) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Application submitted successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Email could not be sent. Please check server configuration."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed."]);
}
?>
