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

// Configuration de la sécurité - CSP modifiée pour autoriser les ressources locales
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

// Configuration CORS pour le développement local
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting moins strict pour le développement
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

// Middleware de sécurité allégé
app.use((req, res, next) => {
  // En-têtes de sécurité supplémentaires
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// MIDDLEWARE AMÉLIORÉ POUR LES IMAGES ET VIDÉOS
// Servir toutes les images et vidéos avec les headers appropriés
app.get('/images/:filename', (req, res, next) => {
  const filePath = path.join(__dirname, 'public/images', req.params.filename);
  
  // Vérifier si le fichier existe
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Fichier non trouvé');
  }
  
  // Déterminer le type de contenu basé sur l'extension du fichier
  const ext = path.extname(filePath).toLowerCase();
  let contentType = 'application/octet-stream'; // Par défaut
  
  if (ext === '.mp4' || ext === '.webm' || ext === '.ogg') {
    // Traitement spécial pour les vidéos avec streaming
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
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

// Pour la compatibilité, garder la route /videos
app.get('/videos/:filename', (req, res) => {
  // Rediriger vers /images pour la cohérence
  res.redirect(`/images/${req.params.filename}`);
});

// Middleware pour servir les fichiers statiques - Après les routes spécifiques
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
  res.redirect('/images/favicon.svg');
});

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route pour toutes les autres pages HTML
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

// Route robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nDisallow: /checkout/\nSitemap: https://www.iptvsmarterpros.com/sitemap.xml`);
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur amélioré démarré sur le port ${PORT}`);
  console.log(`Ouvrez http://localhost:${PORT} dans votre navigateur`);
}); 