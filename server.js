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

// Route API pour envoyer l'e-mail de commande
app.post('/api/send-email', async (req, res) => {
  const { clientEmail, orderId, product, price } = req.body;

  // Configure le transport SMTP
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,       // ex: smtp.gmail.com
    port: process.env.SMTP_PORT,       // ex: 587
    secure: false,                     // false pour le port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  let mailOptions = {
    from: `"IPTV Pro" <${process.env.SMTP_USER}>`,
    to: process.env.MERCHANT_EMAIL,     // Ton e-mail marchand
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
    console.log("Message envoyé : %s", info.messageId);
    res.status(200).json({ message: 'Email envoyé avec succès' });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email :", error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email' });
  }
});

// Démarrer le serveur sur le port fourni par Heroku ou 3000 en local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
