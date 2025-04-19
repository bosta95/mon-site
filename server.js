const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss');
const emailUtils = require('./email-utils'); // Import du module email-utils
const fs = require('fs');
require('dotenv').config();

const app = express();

// Configuration de la sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Configuration CORS pour Netlify
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting strict
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});
app.use('/api/', apiLimiter);

// Rate limiting pour les emails
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de tentatives d\'envoi d\'email, veuillez réessayer plus tard.' }
});
app.use('/api/contact', emailLimiter);
app.use('/api/order', emailLimiter);

// Configuration de la compression
app.use(compression());

// Middleware pour parser les requêtes JSON avec limite de taille
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Protection contre les attaques par force brute
const bruteForce = new Map();
const MAX_ATTEMPTS = 20;
const BLOCK_DURATION = 5 * 60 * 1000; // 5 minutes

function checkBruteForce(ip) {
  const now = Date.now();
  const attempt = bruteForce.get(ip) || { count: 0, timestamp: now };
  
  if (now - attempt.timestamp > BLOCK_DURATION) {
    attempt.count = 1;
    attempt.timestamp = now;
  } else {
    attempt.count++;
  }
  
  bruteForce.set(ip, attempt);
  return attempt.count > MAX_ATTEMPTS;
}

// Middleware de sécurité
app.use((req, res, next) => {
  // En-têtes de sécurité supplémentaires
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Vérification de la protection contre la force brute - seulement en production
  if (process.env.NODE_ENV === 'production' && checkBruteForce(req.ip)) {
    return res.status(429).json({ error: 'Trop de tentatives, veuillez réessayer plus tard.' });
  }
  
  next();
});

// Middleware pour servir les fichiers statiques - AVANT la configuration des routes
app.use('/', express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Middleware spécifique pour les vidéos avec les bons en-têtes Content-Type
app.get('/videos/:filename', (req, res) => {
  // Chercher d'abord dans le dossier videos s'il existe
  let filePath = path.join(__dirname, 'public/videos', req.params.filename);
  
  // Si le fichier n'existe pas dans /videos, chercher dans /images
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'public/images', req.params.filename);
    
    // Si toujours pas trouvé, renvoyer 404
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Fichier non trouvé');
    }
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Si demande de streaming avec Range headers
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, {start, end});
    
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4'
    });
    file.pipe(res);
  } else {
    // Si demande normale
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4'
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

// Ajout d'un endpoint pour faciliter l'accès aux vidéos dans le dossier /images
app.get('/images/:filename', (req, res, next) => {
  const filePath = path.join(__dirname, 'public/images', req.params.filename);
  
  // Vérifier si le fichier existe et s'il s'agit d'un fichier vidéo
  if (fs.existsSync(filePath) && 
      (req.params.filename.endsWith('.mp4') || 
       req.params.filename.endsWith('.webm') || 
       req.params.filename.endsWith('.ogg'))) {
    
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Si demande de streaming avec Range headers
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, {start, end});
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4'
      });
      file.pipe(res);
    } else {
      // Si demande normale
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4'
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } else {
    // Si ce n'est pas un fichier vidéo, passer au middleware suivant
    next();
  }
});

// Redirection favicon
app.get('/favicon.ico', (req, res) => {
  res.redirect('/favicon.svg');
});

// Fonction de validation d'email améliorée
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Fonction de validation des données
function sanitizeInput(input) {
  return xss(input.trim());
}

function isValidOrderNumber(orderNumber) {
  return /^[A-Za-z0-9-]{8,32}$/.test(orderNumber);
}

function isValidProduct(product) {
  const validProducts = ['1_mois', '3_mois', '6_mois', '12_mois'];
  return validProducts.includes(product);
}

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route tutoriel
app.get('/tutoriel.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tutoriel.html'));
});

// Route robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nDisallow: /checkout/\nSitemap: https://www.iptvsmarterpros.com/sitemap.xml`);
});

// Route API pour le formulaire de contact
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation des entrées
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message trop long' });
    }

    // Assainissement des entrées
    const sanitizedName = sanitizeInput(name);
    const sanitizedSubject = sanitizeInput(subject);
    const sanitizedMessage = sanitizeInput(message);

    console.log('Tentative d\'envoi d\'email - Formulaire de contact');

    try {
      // Utiliser emailUtils pour envoyer un email avec le template
      await emailUtils.sendTemplateEmail({
        to: process.env.MERCHANT_EMAIL,
        subject: `[Contact] ${sanitizedSubject}`,
        templateName: 'contact-message',
        data: {
          name: sanitizedName,
          email: email,
          subject: sanitizedSubject,
          message: sanitizedMessage,
          date: new Date().toLocaleDateString(),
          clientIP: req.ip || 'Inconnue'
        }
      });
      
      console.log('Email de contact envoyé avec succès');
      return res.status(200).json({ success: 'Email envoyé avec succès !' });
    } catch (sendError) {
      console.error('Erreur lors de l\'envoi de l\'email:', sendError);
      return res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer plus tard.' });
    }

  } catch (error) {
    return res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer plus tard.' });
  }
});

// Route API pour les commandes
app.post('/api/order', async (req, res) => {
  try {
    const { email, product, orderNumber } = req.body;

    // Validation des entrées
    if (!email || !product || !orderNumber) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' });
    }

    if (!isValidProduct(product)) {
      return res.status(400).json({ error: 'Produit invalide' });
    }

    if (!isValidOrderNumber(orderNumber)) {
      return res.status(400).json({ error: 'Numéro de commande invalide' });
    }

    console.log('Tentative d\'envoi d\'email - Commande:', orderNumber);

    try {
      // Email au client avec le template
      await emailUtils.sendTemplateEmail({
        to: email,
        subject: `Confirmation de commande N° ${orderNumber}`,
        templateName: 'order-confirmation',
        data: {
          orderNumber: orderNumber,
          productName: getProductName(product),
          productDescription: getProductDescription(product),
          productPrice: getProductPrice(product),
          orderDate: new Date().toLocaleDateString(),
          orderTotal: getProductPrice(product),
          userName: email.split('@')[0],
          paymentMethod: 'PayPal'
        }
      });
      console.log('Email client envoyé avec succès');

      // Email à l'administrateur avec le template
      await emailUtils.sendTemplateEmail({
        to: process.env.MERCHANT_EMAIL,
        subject: `[Nouvelle Commande] N° ${orderNumber}`,
        templateName: 'admin-notification',
        data: {
          orderNumber: orderNumber,
          productName: getProductName(product),
          orderDate: new Date().toLocaleDateString(),
          orderTime: new Date().toLocaleTimeString(),
          productPrice: getProductPrice(product),
          paymentMethod: 'PayPal',
          clientEmail: email,
          clientCountry: 'France',
          clientIP: req.ip || 'Inconnue',
          clientDevice: req.headers['user-agent'] || 'Inconnu',
          clientPhone: '-'
        }
      });
      console.log('Email admin envoyé avec succès');

      return res.status(200).json({ 
        success: 'Commande enregistrée et emails envoyés avec succès',
        orderNumber,
        timestamp: new Date().toISOString()
      });
    } catch (sendError) {
      console.error('Erreur lors de l\'envoi des emails de commande:', sendError);
      return res.status(500).json({ 
        error: 'Une erreur est survenue lors de l\'envoi des emails'
      });
    }

  } catch (error) {
    return res.status(500).json({ 
      error: 'Une erreur est survenue lors de l\'envoi des emails'
    });
  }
});

// Fonctions auxiliaires pour les informations de produit
function getProductName(productCode) {
  const productNames = {
    '1_mois': 'Abonnement IPTV Premium - 1 Mois',
    '3_mois': 'Abonnement IPTV Premium - 3 Mois',
    '6_mois': 'Abonnement IPTV Premium - 6 Mois',
    '12_mois': 'Abonnement IPTV Premium - 12 Mois'
  };
  return productNames[productCode] || 'Abonnement IPTV Premium';
}

function getProductDescription(productCode) {
  const productDescriptions = {
    '1_mois': 'Accès à plus de 10,000 chaînes TV et VOD pendant 1 mois',
    '3_mois': 'Accès à plus de 10,000 chaînes TV et VOD pendant 3 mois',
    '6_mois': 'Accès à plus de 10,000 chaînes TV et VOD pendant 6 mois',
    '12_mois': 'Accès à plus de 10,000 chaînes TV et VOD pendant 12 mois'
  };
  return productDescriptions[productCode] || 'Accès à notre service IPTV premium';
}

function getProductPrice(productCode) {
  const productPrices = {
    '1_mois': '14,99 €',
    '3_mois': '34,99 €',
    '6_mois': '59,99 €',
    '12_mois': '99,99 €'
  };
  return productPrices[productCode] || 'Prix non spécifié';
}

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
}); 