const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const compression = require('compression');
require('dotenv').config();

const app = express();

// Forcer HTTPS uniquement en production (évite les boucles infinies)
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

// Redirection pour /favicon.ico
app.get('/favicon.ico', (req, res) => {
  res.redirect('/favicon.svg');
});

// Route principale pour servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route explicite pour tutoriel.html (optionnelle)
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
    host: process.env.SMTP_HOST,       // Ex: mail.privateemail.com
    port: process.env.SMTP_PORT,       // Ex: 465 ou 587
    secure: process.env.SMTP_PORT == 465, // true si port 465, sinon false
    auth: {
      user: process.env.SMTP_USER,     // Ex: contact@iptvsmarterpros.com
      pass: process.env.SMTP_PASS
    }
  });
}

// Démarrage du serveur avec le bon port Heroku
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
});
