<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// --- GET Request: সব টাস্ক লোড করা ---
if ($method === 'GET') {
    try {
        // created_at DESC মানে নতুন টাস্ক আগে দেখাবে
        $stmt = $pdo->query("SELECT * FROM sae_tasks ORDER BY created_at DESC");
        $tasks = $stmt->fetchAll();
        
        // PHP তে boolean ভ্যালু 0/1 হিসেবে আসে, তাই true/false এ কনভার্ট করা
        foreach ($tasks as &$t) {
            $t['is_completed'] = (bool)$t['is_completed'];
        }
        
        echo json_encode($tasks);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// --- POST Request: তৈরি, টগল বা ডিলিট ---
if ($method === 'POST' && isset($input['action'])) {
    try {
        $action = $input['action'];

        if ($action === 'create') {
            // নতুন টাস্ক তৈরি
            $sql = "INSERT INTO sae_tasks (id, text, is_completed, due_date, lead_id, created_at) VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            
            $stmt->execute([
                $input['id'],
                $input['text'],
                0, // is_completed default false
                $input['due_date'] ?? null,
                $input['lead_id'] ?? null,
                $input['created_at'] ?? date('Y-m-d H:i:s')
            ]);
            
            echo json_encode(["success" => true, "message" => "Task created"]);

        } elseif ($action === 'toggle') {
            // টাস্ক কমপ্লিট/ইনকমপ্লিট করা (SQL দিয়ে টগল করা)
            $id = $input['id'];
            $sql = "UPDATE sae_tasks SET is_completed = NOT is_completed WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$id]);

            echo json_encode(["success" => true, "message" => "Task toggled"]);

        } elseif ($action === 'delete') {
            // টাস্ক ডিলিট
            $stmt = $pdo->prepare("DELETE FROM sae_tasks WHERE id = ?");
            $stmt->execute([$input['id']]);
            echo json_encode(["success" => true, "message" => "Task deleted"]);
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}
?>