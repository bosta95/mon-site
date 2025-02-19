// server.js - Version sans Stripe
require('dotenv').config();
const express = require('express');
const app = express();

// Sert les fichiers statiques dans le dossier public
app.use(express.static('public'));
app.use(express.json());

// Endpoint de test pour les paiements (à remplacer plus tard)
app.post('/payment-placeholder', (req, res) => {
  res.json({ message: "Système de paiement en cours de mise à jour." });
});

// Utilise le port défini par Heroku ou 3000 en local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
