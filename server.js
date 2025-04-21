const express = require('express');
const path = require('path');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss');
const emailUtils = require('./email-utils');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Configuration de la sécurité avec CSP optimisée
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://kit.fontawesome.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "blob:"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com", "https://youtube.com"],
    },
  },
}));

// Configuration CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting pour l'API
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
  if (process.env.NODE_ENV !== 'production') return false;
  
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
  // En-têtes de sécurité
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Vérification brute force en production
  if (checkBruteForce(req.ip)) {
    return res.status(429).json({ error: 'Trop de tentatives, veuillez réessayer plus tard.' });
  }
  
  next();
});

// GESTION OPTIMISÉE DES MÉDIAS
// Middleware unifié pour les images et vidéos
app.get('/images/:filename', (req, res, next) => {
  const filePath = path.join(__dirname, 'public/images', req.params.filename);
  
  // Vérifier si le fichier existe
  if (!fs.existsSync(filePath)) {
    return next(); // Passer au middleware suivant si fichier non trouvé
  }
  
  // Déterminer le type de contenu basé sur l'extension du fichier
  const ext = path.extname(filePath).toLowerCase();
  
  // Traitement spécial pour les vidéos
  if (ext === '.mp4' || ext === '.webm' || ext === '.ogg') {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    let contentType = 'application/octet-stream';
    if (ext === '.mp4') contentType = 'video/mp4';
    else if (ext === '.webm') contentType = 'video/webm';
    else if (ext === '.ogg') contentType = 'video/ogg';
    
    if (range) {
      // Streaming avec Range headers
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, {start, end});
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType
      });
      file.pipe(res);
    } else {
      // Requête normale pour vidéo
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } else {
    // Pour les images et autres fichiers, utiliser le middleware statique normal
    next();
  }
});

// Pour la compatibilité, rediriger /videos vers /images
app.get('/videos/:filename', (req, res) => {
  res.redirect(`/images/${req.params.filename}`);
});

// Middleware pour servir les fichiers statiques
app.use('/', express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Redirection favicon
app.get('/favicon.ico', (req, res) => {
  res.redirect('/favicon.svg');
});

// Fonctions utilitaires
function sanitizeInput(input) {
  return typeof input === 'string' ? xss(input.trim()) : '';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidOrderNumber(orderNumber) {
  return /^[A-Za-z0-9_-]{5,50}$/.test(orderNumber);
}

function isValidProduct(product) {
  const validProducts = ['Premium_IPTV_3_mois', 'Premium_IPTV_6_mois', 'Premium_IPTV_12_mois', 
                          'Premium_IPTV_2_ecrans', 'Premium_IPTV_3_ecrans', 'Premium_IPTV_4_ecrans'];
  return validProducts.includes(product);
}

// Route pour les contacts
app.post('/api/contact', async (req, res) => {
  try {
    // Validation et sanitization des entrées
    const name = sanitizeInput(req.body.name);
    const email = sanitizeInput(req.body.email);
    const subject = sanitizeInput(req.body.subject);
    const message = sanitizeInput(req.body.message);
    
    // Validation des données
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }
    
    // Envoi de l'email à l'administrateur
    await emailUtils.sendTemplateEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `[Contact] ${subject}`,
      templateName: 'contact-message',
      data: {
        name,
        email,
        subject,
        message,
        date: new Date().toLocaleString('fr-FR')
      }
    });
    
    // Envoi de l'email de confirmation au client
    await emailUtils.sendTemplateEmail({
      to: email,
      subject: 'Votre message a bien été reçu',
      templateName: 'contact-message',
      data: {
        name,
        subject
      }
    });
    
    res.status(200).json({ success: 'Votre message a bien été envoyé' });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({ error: 'Une erreur est survenue lors de l\'envoi du message' });
  }
});

// Route pour les commandes
app.post('/api/order', async (req, res) => {
  try {
    // Validation et sanitization des entrées
    const email = sanitizeInput(req.body.email);
    const product = sanitizeInput(req.body.product);
    const orderNumber = sanitizeInput(req.body.orderNumber);
    
    // Validation des données
    if (!email || !product || !orderNumber) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }
    
    if (!isValidOrderNumber(orderNumber)) {
      return res.status(400).json({ error: 'Numéro de commande invalide' });
    }
    
    if (!isValidProduct(product)) {
      return res.status(400).json({ error: 'Produit invalide' });
    }
    
    // Envoi de l'email de confirmation au client
    await emailUtils.sendTemplateEmail({
      to: email,
      subject: 'Confirmation de votre commande',
      templateName: 'order-confirmation',
      data: {
        product: getProductName(product),
        orderNumber,
        description: getProductDescription(product),
        price: getProductPrice(product)
      }
    });
    
    // Envoi de l'email de notification à l'administrateur
    await emailUtils.sendTemplateEmail({
      to: process.env.MERCHANT_EMAIL,
      subject: 'Nouvelle commande reçue',
      templateName: 'admin-notification',
      data: {
        email,
        product: getProductName(product),
        orderNumber,
        description: getProductDescription(product),
        price: getProductPrice(product),
        date: new Date().toLocaleString('fr-FR')
      }
    });
    
    res.status(200).json({ success: 'Commande confirmée' });
  } catch (error) {
    console.error('Erreur lors de la confirmation de commande:', error);
    res.status(500).json({ error: 'Une erreur est survenue lors de la confirmation de commande' });
  }
});

// Fonctions pour obtenir les informations des produits
function getProductName(productCode) {
  const productNames = {
    'Premium_IPTV_3_mois': 'Abonnement IPTV Premium 3 mois',
    'Premium_IPTV_6_mois': 'Abonnement IPTV Premium 6 mois',
    'Premium_IPTV_12_mois': 'Abonnement IPTV Premium 12 mois',
    'Premium_IPTV_2_ecrans': 'Abonnement IPTV Premium 2 écrans',
    'Premium_IPTV_3_ecrans': 'Abonnement IPTV Premium 3 écrans',
    'Premium_IPTV_4_ecrans': 'Abonnement IPTV Premium 4 écrans'
  };
  return productNames[productCode] || 'Abonnement IPTV Premium';
}

function getProductDescription(productCode) {
  const descriptions = {
    'Premium_IPTV_3_mois': 'Accès à plus de 22 000 chaînes et 50 000 VOD pendant 3 mois',
    'Premium_IPTV_6_mois': 'Accès à plus de 22 000 chaînes et 50 000 VOD pendant 6 mois',
    'Premium_IPTV_12_mois': 'Accès à plus de 22 000 chaînes et 50 000 VOD pendant 12 mois',
    'Premium_IPTV_2_ecrans': 'Accès à plus de 22 000 chaînes et 50 000 VOD pour 2 écrans pendant 12 mois',
    'Premium_IPTV_3_ecrans': 'Accès à plus de 22 000 chaînes et 50 000 VOD pour 3 écrans pendant 12 mois',
    'Premium_IPTV_4_ecrans': 'Accès à plus de 22 000 chaînes et 50 000 VOD pour 4 écrans pendant 12 mois'
  };
  return descriptions[productCode] || 'Accès à notre service IPTV Premium';
}

function getProductPrice(productCode) {
  const prices = {
    'Premium_IPTV_3_mois': '9,99 €',
    'Premium_IPTV_6_mois': '19,99 €',
    'Premium_IPTV_12_mois': '29,99 €',
    'Premium_IPTV_2_ecrans': '59,99 €',
    'Premium_IPTV_3_ecrans': '79,99 €',
    'Premium_IPTV_4_ecrans': '99,99 €'
  };
  return prices[productCode] || 'Prix personnalisé';
}

// Route robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nDisallow: /checkout/\nSitemap: https://www.iptvsmarterpros.com/sitemap.xml`);
});

// Route pour les pages HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/:page.html', (req, res) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, 'public', `${page}.html`);
  
  // Vérifier si le fichier existe
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Page non trouvée');
  }
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Ouvrez http://localhost:${PORT} dans votre navigateur`);
  }
}); 