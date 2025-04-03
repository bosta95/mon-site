const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
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
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Configuration des sessions
if (!process.env.SESSION_SECRET) {
  console.error('ERREUR: SESSION_SECRET doit être défini dans les variables d\'environnement');
  process.exit(1);
}

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

// Configuration CORS sécurisée
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : 'https://iptvsmarterpros.com',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting strict
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});
app.use('/api/', apiLimiter);

// Rate limiting pour les emails
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
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
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 30 * 60 * 1000; // 30 minutes

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
  
  // Vérification de la protection contre la force brute
  if (checkBruteForce(req.ip)) {
    return res.status(429).json({ error: 'Trop de tentatives, veuillez réessayer plus tard.' });
  }
  
  next();
});

// Servir les fichiers statiques de manière sécurisée
app.use(express.static(path.join(__dirname, 'public'), {
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

// Fonctions de gestion des utilisateurs
const usersFilePath = path.join(__dirname, 'users.json');

async function loadUsers() {
  try {
    const data = await fs.readFile(usersFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveUsers(users) {
  await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
}

// Middleware d'authentification
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Accès non autorisé' });
  }
};

// Routes d'authentification
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const users = await loadUsers();
    
    if (users.some(user => user.username === username)) {
      return res.status(400).json({ error: 'Nom d\'utilisateur déjà pris' });
    }

    if (users.some(user => user.email === email)) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      role: 'user'
    };

    users.push(newUser);
    await saveUsers(users);

    res.status(201).json({ message: 'Compte créé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const users = await loadUsers();
    const user = users.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    req.session.userId = user.id;
    req.session.userRole = user.role;

    res.json({ 
      message: 'Connexion réussie',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de la déconnexion' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Déconnexion réussie' });
  });
});

// Routes d'authentification supplémentaires
app.get('/api/auth/check', requireAuth, (req, res) => {
  res.status(200).json({ authenticated: true });
});

app.get('/api/auth/check-role', requireAuth, (req, res) => {
  res.status(200).json({ role: req.session.userRole });
});

app.get('/api/auth/current-user', requireAuth, async (req, res) => {
  try {
    const users = await loadUsers();
    const user = users.find(u => u.id === req.session.userId);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } else {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

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
  res.send(`User-agent: *\nDisallow: /admin/\nDisallow: /checkout/\nSitemap: https://www.iptvsmarterpros.com/sitemap.xml`);
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

// Route API pour le formulaire de contact
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation des entrées
    if (!name || !email || !message) {
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
    const sanitizedMessage = sanitizeInput(message);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        minVersion: 'TLSv1.2',
        ciphers: 'HIGH:!aNULL:!MD5'
      }
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.MERCHANT_EMAIL,
      subject: `Nouveau message de ${sanitizedName}`,
      text: `Nom: ${sanitizedName}\nEmail: ${email}\nMessage: ${sanitizedMessage}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50;">Nouveau message de contact</h1>
          <p><strong>Nom:</strong> ${sanitizedName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${sanitizedMessage}</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: 'Email envoyé avec succès !' });

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

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        minVersion: 'TLSv1.2',
        ciphers: 'HIGH:!aNULL:!MD5'
      }
    });

    // Email au client
    await transporter.sendMail({
      from: `"IPTV Smarter Pros" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Confirmation de commande N° ${orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50; text-align: center;">Confirmation de votre commande</h2>
          
          <p>Bonjour,</p>
          
          <p>Nous vous remercions pour votre confiance ! Votre commande a bien été enregistrée.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Détails de votre commande</h3>
            <p><strong>Numéro de commande :</strong> ${orderNumber}</p>
            <p><strong>Produit :</strong> ${product}</p>
          </div>
          
          <p>Pour toute question concernant votre commande, n'hésitez pas à nous contacter à <a href="mailto:${process.env.MERCHANT_EMAIL}" style="color: #3498db;">${process.env.MERCHANT_EMAIL}</a></p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      `
    });

    // Email à l'administrateur
    await transporter.sendMail({
      from: `"IPTV Smarter Pros" <${process.env.SMTP_USER}>`,
      to: process.env.MERCHANT_EMAIL,
      subject: `[Nouvelle Commande] N° ${orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50;">Nouvelle commande reçue</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Détails de la commande</h3>
            <p><strong>Numéro de commande :</strong> ${orderNumber}</p>
            <p><strong>Produit :</strong> ${product}</p>
            <p><strong>Email du client :</strong> ${email}</p>
          </div>
          
          <p>Cette commande nécessite votre attention pour le traitement.</p>
        </div>
      `
    });

    return res.status(200).json({ 
      success: 'Commande enregistrée et emails envoyés avec succès',
      orderNumber,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Une erreur est survenue lors de l\'envoi des emails'
    });
  }
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
