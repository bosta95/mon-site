const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

// Configuration de Nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT), // S'assurer que le port est bien un nombre
    secure: false, // false pour TLS, true pour SSL
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Route pour le formulaire de contact
app.post("/api/contact", async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const mailOptions = {
        from: `"${name}" <${process.env.SMTP_USER}>`,
        to: process.env.MERCHANT_EMAIL,
        subject: "Nouveau message depuis le formulaire de contact",
        text: `Nom: ${name}\nEmail: ${email}\nMessage: ${message}`,
        html: `<p><strong>Nom:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong> ${message}</p>`
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log("Email envoyé: ", info.messageId);
        res.status(200).json({ message: "Email envoyé avec succès" });
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'email :", error);
        res.status(500).json({ message: "Erreur lors de l'envoi de l'email" });
    }
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
