const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const compression = require('compression');
require('dotenv').config();

const app = express();

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

// Middleware pour parser les requêtes JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1y',
  etag: false
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
    secure: process.env.SMTP_PORT == 465, // true si 465, false sinon
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// 📌 Route API pour envoyer un email depuis le formulaire de contact
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.MERCHANT_EMAIL, 
      subject: `Nouveau message de ${name}`,
      text: `Nom: ${name}\nEmail: ${email}\nMessage: ${message}`,
      html: `<p><strong>Nom:</strong> ${name}</p>
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
