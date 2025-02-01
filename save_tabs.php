<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Only handle POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get JSON data from request body
$json = file_get_contents('php://input');

// Validate JSON
if (!json_decode($json)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON data']);
    exit;
}

// Save to file
$result = file_put_contents('tab_list.json', $json);

if ($result === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save file']);
} else {
    echo json_encode(['success' => true, 'bytes_written' => $result]);
}
