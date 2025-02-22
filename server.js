const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const compression = require('compression');
require('dotenv').config();

const app = express();

// Forcer la redirection vers HTTPS uniquement en production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.get('Host')}${req.url}`);
    }
    next();
  });
}

// Activer la compression pour toutes les réponses
app.use(compression());

// Pour recevoir du JSON dans les requêtes POST
app.use(express.json());

// Servir les fichiers statiques depuis le dossier "public" avec mise en cache
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1y',
  etag: false
}));

// Route racine pour servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route explicite pour tutoriel.html (optionnelle, car il est servi statiquement)
app.get('/tutoriel.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tutoriel.html'));
});

// Route pour servir robots.txt dynamiquement
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nDisallow: /admin/\nDisallow: /checkout/\nSitemap: https://www.iptvsmarterpros.com/sitemap.xml`);
});

// Fonction utilitaire pour créer le transporteur Nodemailer
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,       // ex: mail.privateemail.com
    port: process.env.SMTP_PORT,       // ex: 465 ou 587
    secure: process.env.SMTP_PORT == 465, // true si port 465, sinon false
    auth: {
      user: process.env.SMTP_USER,     // ex: contact@iptvsmarterpros.com
      pass: process.env.SMTP_PASS
    }
  });
}

// (Les routes d'email et de contact restent inchangées)

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
