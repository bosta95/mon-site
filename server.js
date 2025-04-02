const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configuration de la sécurité avec des règles plus souples pour le test
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
}));

// Configuration CORS plus permissive pour le test
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Configuration de la compression
app.use(compression());

// Middleware pour parser les requêtes JSON avec limite de taille
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Redirection favicon
app.get('/favicon.ico', (req, res) => {
  res.redirect('/favicon.svg');
});

// Route principale pour servir index.html
app.get('/', (req, res) => {
  console.log('Accès à la page d\'accueil');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route explicite pour la page de test
app.get('/test.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

// Route explicite pour la page de test simple
app.get('/test-simple', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test-simple.html'));
});

// Route tutoriel.html (optionnelle)
app.get('/tutoriel.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tutoriel.html'));
});

// Route du flyer pour faciliter l'accès
app.get('/flyer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'flyer.html'));
});

// Route robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nDisallow: /admin/\nDisallow: /checkout/\nSitemap: https://www.iptvsmarterpros.com/sitemap.xml`);
});

// Route de test
app.get('/test', (req, res) => {
  console.log('Accès à la page de test');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Email</title>
    </head>
    <body>
      <h1>Test d'envoi d'email</h1>
      <form id="testForm">
        <div>
          <label>Email:</label>
          <input type="email" id="email" required>
        </div>
        <div>
          <label>Produit:</label>
          <input type="text" id="product" required>
        </div>
        <div>
          <label>Numéro de commande:</label>
          <input type="text" id="orderNumber" required>
        </div>
        <button type="submit">Envoyer</button>
      </form>
      <div id="result"></div>
      <script>
        document.getElementById('testForm').onsubmit = async (e) => {
          e.preventDefault();
          const data = {
            email: document.getElementById('email').value,
            product: document.getElementById('product').value,
            orderNumber: document.getElementById('orderNumber').value
          };
          try {
            const response = await fetch('/api/order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            const result = await response.json();
            document.getElementById('result').textContent = 
              response.ok ? 'Email envoyé !' : 'Erreur: ' + result.error;
          } catch (error) {
            document.getElementById('result').textContent = 'Erreur: ' + error.message;
          }
        };
      </script>
    </body>
    </html>
  `);
});

// Route pour la page de test d'email
app.get('/test-email', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test-email.html'));
});

// Route API pour tester l'envoi d'email
app.post('/api/test-email', async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"IPTV Smarter Pros" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50;">Test d'envoi d'email</h2>
          <p>${message}</p>
          <p>Cet email a été envoyé via le serveur SMTP de Namecheap.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ 
      success: 'Email de test envoyé avec succès',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de test:', error.message);
    return res.status(500).json({ 
      error: 'Une erreur est survenue lors de l\'envoi de l\'email',
      details: error.message
    });
  }
});

// Fonction pour configurer Nodemailer
function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.privateemail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER || 'contact@iptvsmarterpros.com',
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: true,
    logger: true,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5
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

// Route API pour envoyer un email après une commande
app.post('/api/order', async (req, res) => {
  console.log('Tentative d\'envoi d\'email:', req.body);
  try {
    const { email, product, orderNumber } = req.body;

    if (!email || !product || !orderNumber) {
      console.log('❌ Données manquantes:', { email, product, orderNumber });
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    console.log('📧 Configuration SMTP:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      merchantEmail: process.env.MERCHANT_EMAIL
    });

    const transporter = createTransporter();

    // Email pour le client
    console.log('📧 Envoi de l\'email au client:', email);
    const clientEmail = await transporter.sendMail({
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
          
          <p>Pour toute question concernant votre commande, n'hésitez pas à nous contacter à <a href="mailto:contact@iptvsmarterpros.com">contact@iptvsmarterpros.com</a></p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      `
    });

    // Email pour l'admin
    console.log('📧 Envoi de l\'email à l\'admin:', process.env.MERCHANT_EMAIL);
    const adminEmail = await transporter.sendMail({
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

    console.log('✅ Emails envoyés avec succès !');
    console.log('📧 ID du message client:', clientEmail.messageId);
    console.log('📧 ID du message admin:', adminEmail.messageId);

    return res.status(200).json({ 
      success: 'Commande enregistrée et emails envoyés avec succès',
      orderNumber,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:', error.message);
    console.error('❌ Détails de l\'erreur:', error);
    return res.status(500).json({ 
      error: 'Une erreur est survenue lors de l\'envoi des emails',
      details: error.message
    });
  }
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📧 Email configuré: ${process.env.SMTP_USER}`);
  console.log(`📁 Dossier public: ${path.join(__dirname, 'public')}\n`);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non capturée:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Promesse rejetée non gérée:', error);
});
