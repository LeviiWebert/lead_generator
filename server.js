const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// URL du web-hook Google Sheets (à configurer comme dans le guide)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGcqo99nEV-o4CsfabkzFGYeUyvKo6XSf9SQ4iFFWxmSSkaaKW-zG6gQfZn14qm-WSYA/exec';

// Middleware
app.use(cors());
app.use(express.json()); // Pour analyser l'application/json depuis le frontend
app.use(express.urlencoded({ extended: true }));

// On sert tous les fichiers de ce dossier (index.html, styles.css, script.js)
app.use(express.static(__dirname));

// Fonction de "Nettoyage" pour prévenir les attaques XSS basiques côté serveur
const sanitizeInput = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
};

// --- ENDPOINT API: OBTENIR UN LEAD ---
app.post('/api/leads', async (req, res) => {
    try {
        const data = req.body;

        // 1. Validation de la sécurité au Back-end
        const prenom = sanitizeInput(data.prenom);
        const nom = sanitizeInput(data.nom);
        const email = sanitizeInput(data.email);
        const phone = sanitizeInput(data.phone);
        const cp = sanitizeInput(data.cp);

        // Champs obligatoires minimaux
        if (!prenom || !nom || !phone || !email || !cp) {
            return res.status(400).json({ error: 'Des informations de contact sont manquantes.' });
        }

        // Format Regex basique pour l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Format email invalide.' });
        }

        // 2. Transfert vers Google Sheets au travers du backend de façon ultra-sécurisée !
        // Préparation du FormData (x-www-form-urlencoded format native from node fetch)
        const payload = new URLSearchParams();
        payload.append('prenom', prenom);
        payload.append('nom', nom);
        payload.append('email', email);
        payload.append('telephone', phone);
        payload.append('codepostal', cp);

        // Ajout des informations du simulateur
        payload.append('chauffage', sanitizeInput(data.chauffage) || 'Non spécifié');
        payload.append('surface', sanitizeInput(data.surface) || 'Non spécifié');
        payload.append('type_bien', sanitizeInput(data.type_bien) || 'Non spécifié');
        payload.append('jardin', sanitizeInput(data.jardin_dispo) || 'Non spécifié');
        payload.append('emetteur', sanitizeInput(data.emetteur) || 'Non spécifié');
        payload.append('situation', sanitizeInput(data.situation) || 'Non spécifié');
        payload.append('date', new Date().toLocaleString('fr-FR'));

        if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== 'VOTRE_URL_GOOGLE_APPS_SCRIPT_ICI') {
            const sheetResponse = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: payload
            });
            const resultText = await sheetResponse.text();
            console.log('✅ Lead sécurisé et envoyé à Google Sheets:', resultText);
        } else {
            console.log('⚠️ [MODE DEV] Lead Reçu par le Back-end (Non envoyé au Sheets car URL manquante):', {
                Prenom: prenom, Nom: nom, Email: email, Telephone: phone, CP: cp,
                Projet: `${data.chauffage} / ${data.surface} / ${data.type_bien}`
            });
        }

        // 3. Réponse avec succès si tout c'est bien passé
        res.status(200).json({ success: true, message: 'Le projet a été validé avec succès.' });

    } catch (error) {
        console.error('❌ Erreur Critique Serveur :', error);
        res.status(500).json({ error: 'Erreur interne du serveur lors du traitement de la demande.' });
    }
});

// Lancement
app.listen(PORT, () => {
    console.log(`🛡️ Serveur Backend démarré sur http://localhost:${PORT}`);
    console.log(`📌 N'oubliez pas d'insérer l'URL Google Apps Script ligne 8 de ce server.js pour connecter le Sheets !`);
});
