<?php
header('Content-Type: application/json');

// Code de sécurité IONOS (empêche d'appeler le script depuis un autre site)
header("Access-Control-Allow-Origin: *");

// RÉCUPÉRATION DE L'URL GOOGLE (Remplacez par votre lien Google Apps Script)
$GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGcqo99nEV-o4CsfabkzFGYeUyvKo6XSf9SQ4iFFWxmSSkaaKW-zG6gQfZn14qm-WSYA/exec';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Récupérer les données envoyées par script.js
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    // Valider les champs obligatoires
    if (empty($data['prenom']) || empty($data['nom']) || empty($data['phone']) || empty($data['email']) || empty($data['cp'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Des informations de contact sont manquantes.']);
        exit;
    }

    // Préparer les données pour Google Sheets (format x-www-form-urlencoded)
    $payload = http_build_query([
        'prenom' => $data['prenom'],
        'nom' => $data['nom'],
        'email' => $data['email'],
        'telephone' => $data['phone'],
        'codepostal' => $data['cp'],
        'chauffage' => isset($data['chauffage']) ? $data['chauffage'] : 'Non spécifié',
        'surface' => isset($data['surface']) ? $data['surface'] : 'Non spécifié',
        'type_bien' => isset($data['type_bien']) ? $data['type_bien'] : 'Non spécifié',
        'jardin' => isset($data['jardin_dispo']) ? $data['jardin_dispo'] : 'Non spécifié',
        'emetteur' => isset($data['emetteur']) ? $data['emetteur'] : 'Non spécifié',
        'situation' => isset($data['situation']) ? $data['situation'] : 'Non spécifié',
        'date' => date('d/m/Y H:i:s')
    ]);

    // Envoi de la requête au serveur Google
    $ch = curl_init($GOOGLE_SCRIPT_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // Très important pour Google Apps Script
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 400) {
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Le projet a été validé avec succès.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de l\'envoi à Google Sheets.']);
    }

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée.']);
}
?>
