const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // false pour STARTTLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Route pour le formulaire de contact
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
    }

    const mailOptions = {
        from: process.env.SMTP_USER, // Utilisation de l'adresse e-mail authentifiée
        to: process.env.MERCHANT_EMAIL, // L'adresse où tu veux recevoir les e-mails
        subject: `Nouveau message de contact de ${name}`,
        text: `Nom: ${name}\nEmail: ${email}\nMessage: ${message}`,
        html: `<p><strong>Nom:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong> ${message}</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email envoyé avec succès');
        res.status(200).json({ message: 'Email envoyé avec succès' });
    } catch (error) {
        console.error('Erreur lors de l'envoi de l'email :', error);
        res.status(500).json({ message: 'Erreur lors de l'envoi de l'email' });
    }
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
});
