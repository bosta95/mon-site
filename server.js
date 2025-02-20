const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Pour recevoir du JSON dans les requêtes POST
app.use(express.json());

// Sert les fichiers statiques depuis le dossier "public"
app.use(express.static(path.join(__dirname, 'public')));

// Middleware pour forcer la redirection vers HTTPS (si besoin)
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.get('Host')}${req.url}`);
  }
  next();
});

// Route racine pour servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

/* ============================================
   ROUTE: Envoi d'un email au marchand (pour toi)
   Contient les infos de commande : orderId, clientEmail, produit, prix
   ============================================ */
app.post('/api/send-email', async (req, res) => {
  const { clientEmail, orderId, product, price } = req.body;
  let transporter = createTransporter();

  let mailOptions = {
    from: `"IPTV Pro" <${process.env.SMTP_USER}>`,
    to: process.env.MERCHANT_EMAIL, // Ton adresse (ex: contact@iptvsmarterpros.com)
    subject: `Nouvelle commande #${orderId} pour ${product}`,
    text: `Nouvelle commande reçue :
Order ID: ${orderId}
Client Email: ${clientEmail}
Produit: ${product}
Prix: ${price}€

Veuillez traiter cette commande et envoyer le code IPTV au client.`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
        <div style="max-width:600px; margin:0 auto; background:#fff; padding:30px; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color:#4B0082;">Nouvelle commande reçue</h2>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Client Email:</strong> ${clientEmail}</p>
          <p><strong>Produit:</strong> ${product}</p>
          <p><strong>Prix:</strong> ${price}€</p>
          <p>Veuillez traiter cette commande et envoyer le code IPTV au client.</p>
        </div>
      </div>
    `
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email envoyé au marchand : %s", info.messageId);
    res.status(200).json({ message: 'Email envoyé avec succès au marchand' });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email au marchand :", error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email au marchand' });
  }
});

/* ============================================
   ROUTE: Envoi d'un email de confirmation au client
   (Email professionnel avec design sombre, logo, etc.)
   ============================================ */
app.post('/api/send-confirmation', async (req, res) => {
  const { clientEmail } = req.body;
  let transporter = createTransporter();

  let mailOptions = {
    from: `"IPTV Pro" <${process.env.SMTP_USER}>`,
    to: clientEmail,
    subject: "Confirmation de votre paiement - IPTV Pro",
    text: `Bonjour,

Votre paiement a été validé.
Vos identifiants pour accéder au service IPTV vous seront envoyés prochainement.
Merci de votre confiance,
L'équipe IPTV Pro`,
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Confirmation de paiement</title>
      </head>
      <body style="margin:0; padding:0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background:#1a1a1a; color:#f1f1f1;">
        <div style="max-width:600px; margin:50px auto; background:#2e2e2e; padding:40px; border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,0.5); text-align:center;">
          <img src="https://res.cloudinary.com/dwcz1jp7j/image/upload/v1739378524/iptv_transparent_kazzld.png" alt="Logo IPTV Pro" style="width:150px; margin-bottom:30px;">
          <h1 style="margin:0; font-size:2.5em; color:#ff8c8c;">Merci pour votre paiement !</h1>
          <p style="font-size:1.1em; line-height:1.6; margin:20px 0;">
            Votre paiement a été validé avec succès.<br>
            Vos identifiants pour accéder au service IPTV vous seront envoyés très prochainement.
          </p>
          <p style="font-size:1.1em; line-height:1.6; margin:20px 0;">
            Nous vous remercions de votre confiance et vous invitons à consulter notre site pour découvrir nos offres exclusives.
          </p>
          <a href="https://www.iptvsmarterpros.com" style="display:inline-block; text-decoration:none; background:#ff8c8c; color:#1a1a1a; padding:15px 30px; border-radius:30px; font-weight:bold; transition:background 0.3s, transform 0.3s;">Retour à l'accueil</a>
          <div style="font-size:0.8em; color:#888; margin-top:30px;">© 2025 IPTV Pro. Tous droits réservés.</div>
        </div>
      </body>
      </html>
    `
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email de confirmation envoyé au client : %s", info.messageId);
    res.status(200).json({ message: 'Email de confirmation envoyé avec succès' });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation :", error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email de confirmation' });
  }
});

/* ============================================
   ROUTE: Envoi d'un email pour le formulaire de contact
   ============================================ */
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  let transporter = createTransporter();

  let mailOptions = {
    from: `"IPTV Pro Contact" <${process.env.SMTP_USER}>`,
    to: process.env.MERCHANT_EMAIL,  // Utilise la variable d'environnement (ex: contact@iptvsmarterpros.com)
    subject: `Nouveau message de contact de ${name}`,
    text: `Nom: ${name}\nEmail: ${email}\nMessage: ${message}`,
    html: `<p><strong>Nom:</strong> ${name}</p>
           <p><strong>Email:</strong> ${email}</p>
           <p><strong>Message:</strong> ${message}</p>`
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email de contact envoyé : %s", info.messageId);
    res.status(200).json({ message: 'Message reçu et email envoyé avec succès !' });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de contact :", error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email de contact.' });
  }
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
