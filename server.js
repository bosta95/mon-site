const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configuration de la sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      mediaSrc: ["'self'", "https://res.cloudinary.com"],
    },
  },
}));

// Configuration CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://www.iptvsmarterpros.com' 
    : 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par fenêtre
});
app.use('/api/', limiter);

// Forcer HTTPS uniquement en production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.get('Host')}${req.url}`);
    }
    next();
  });
}

// Activer la compression
app.use(compression());

// Middleware pour parser les requêtes JSON avec limite de taille
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cache-Control pour les fichiers statiques
const cacheTime = 31536000; // 1 an
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: cacheTime * 1000,
  etag: true,
  lastModified: true
}));

// Redirection favicon
app.get('/favicon.ico', (req, res) => {
  res.redirect('/favicon.svg');
});

// Route principale pour servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route tutoriel.html (optionnelle)
app.get('/tutoriel.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tutoriel.html'));
});

// Route robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nDisallow: /admin/\nDisallow: /checkout/\nSitemap: https://www.iptvsmarterpros.com/sitemap.xml`);
});

// Fonction pour configurer Nodemailer
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// Fonction de validation d'email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 📌 Route API pour envoyer un email depuis le formulaire de contact
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' });
    }

    // Échappement des données utilisateur pour HTML
    const escapedName = name.replace(/[&<>"']/g, (char) => {
      const entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return entities[char];
    });

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.MERCHANT_EMAIL, 
      subject: `Nouveau message de ${escapedName}`,
      text: `Nom: ${escapedName}\nEmail: ${email}\nMessage: ${message}`,
      html: `<p><strong>Nom:</strong> ${escapedName}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Message:</strong> ${message}</p>`
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: 'Email envoyé avec succès !' });

  } catch (error) {
    console.error('Erreur envoi email:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer plus tard.' });
  }
});

// 📌 Route API pour envoyer un email après une commande
app.post('/api/order', async (req, res) => {
  try {
    const { email, product, orderNumber } = req.body;

    if (!email || !product || !orderNumber) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const transporter = createTransporter();

    // 📩 Email pour l'admin
    const adminMailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.MERCHANT_EMAIL,
      subject: `Nouvelle commande - N° ${orderNumber}`,
      text: `Nouvelle commande reçue !\n\nDétails :\n- Produit : ${product}\n- Numéro de commande : ${orderNumber}\n- Email du client : ${email}`,
      html: `<h2>Nouvelle commande reçue !</h2>
             <p><strong>Produit :</strong> ${product}</p>
             <p><strong>Numéro de commande :</strong> ${orderNumber}</p>
             <p><strong>Email du client :</strong> ${email}</p>`
    };

    // 📩 Email de confirmation pour le client
    const clientMailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: `Confirmation de votre commande N° ${orderNumber}`,
      text: `Bonjour,\n\nMerci pour votre commande !\n\nDétails :\n- Produit : ${product}\n- Numéro de commande : ${orderNumber}\n\nNous vous remercions pour votre confiance !`,
      html: `<h2>Merci pour votre commande !</h2>
             <p>Bonjour,</p>
             <p>Nous avons bien reçu votre commande.</p>
             <p><strong>Produit :</strong> ${product}</p>
             <p><strong>Numéro de commande :</strong> ${orderNumber}</p>
             <p>Nous vous remercions pour votre confiance !</p>
             <p>Cordialement, <br> L'équipe IPTV Pro</p>`
    };

    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(clientMailOptions)
    ]);

    return res.status(200).json({ success: 'Commande enregistrée et emails envoyés !' });

  } catch (error) {
    console.error('Erreur lors de l\'envoi des emails :', error);
    return res.status(500).json({ error: 'Erreur lors de l\'envoi des emails.' });
  }
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
});
