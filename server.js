const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Pour recevoir du JSON dans les requêtes POST
app.use(express.json());

// Sert les fichiers statiques depuis le dossier "public"
app.use(express.static(path.join(__dirname, 'public')));

// Route racine pour servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route API pour envoyer l'e-mail de commande au marchand
app.post('/api/send-email', async (req, res) => {
  const { clientEmail, orderId, product, price } = req.body;

  // Configure le transport SMTP avec les variables d'environnement
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,       // Pour SendGrid: smtp.sendgrid.net
    port: process.env.SMTP_PORT,       // 587
    secure: false,                     // false pour le port 587 (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  let mailOptions = {
    from: `"IPTV Pro" <${process.env.SMTP_USER}>`,
    to: process.env.MERCHANT_EMAIL,
    subject: `Nouvelle commande pour ${product}`,
    text: `Nouvelle commande reçue :
Client Email: ${clientEmail}
Order ID: ${orderId}
Produit: ${product}
Prix: ${price}€

Veuillez envoyer le code IPTV au client.`,
    html: `<p>Nouvelle commande reçue :</p>
<p><strong>Client Email:</strong> ${clientEmail}</p>
<p><strong>Order ID:</strong> ${orderId}</p>
<p><strong>Produit:</strong> ${product}</p>
<p><strong>Prix:</strong> ${price}€</p>
<p>Veuillez envoyer le code IPTV au client.</p>`
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

// Route API pour envoyer un email de confirmation au client
app.post('/api/send-confirmation', async (req, res) => {
  const { clientEmail } = req.body;

  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  let mailOptions = {
    from: `"IPTV Pro" <${process.env.SMTP_USER}>`,
    to: clientEmail,
    subject: "Confirmation de votre paiement - IPTV Pro",
    text: `Bonjour,

Votre paiement a été validé.
Vos identifiants pour accéder au service IPTV vous seront envoyés dans moins d'une heure.

Merci de votre confiance,
L'équipe IPTV Pro`,
    html: `<p>Bonjour,</p>
<p>Votre paiement a été validé.</p>
<p>Vos identifiants pour accéder au service IPTV vous seront envoyés dans moins d'une heure.</p>
<p>Merci de votre confiance,<br>L'équipe IPTV Pro</p>`
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

// Route API pour traiter le formulaire de contact
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  let mailOptions = {
    from: `"IPTV Pro Contact" <${process.env.SMTP_USER}>`,
    to: process.env.MERCHANT_EMAIL,
    subject: `Nouveau message de contact de ${name}`,
    text: `Vous avez reçu un nouveau message via le formulaire de contact.
    
Nom: ${name}
Email: ${email}
Message: ${message}`,
    html: `<p>Vous avez reçu un nouveau message via le formulaire de contact :</p>
           <p><strong>Nom:</strong> ${name}</p>
           <p><strong>Email:</strong> ${email}</p>
           <p><strong>Message:</strong> ${message}</p>`
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email de contact envoyé: %s", info.messageId);
    res.status(200).json({ message: "Email envoyé avec succès" });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de contact :", error);
    res.status(500).json({ message: "Erreur lors de l'envoi de l'email de contact" });
  }
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
