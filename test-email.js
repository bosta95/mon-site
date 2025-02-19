const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
        user: "863206001@smtp-brevo.com",
        pass: "ZM4nYAGQmUD0X5V6"
    }
});

let mailOptions = {
    from: '"IPTV PRO" <bosta95845@gmail.com>',
    to: "bosta95845@gmail.com",
    subject: "Test Email Brevo",
    text: "Ceci est un test pour vérifier l'envoi d'e-mail via Brevo SMTP.",
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log("Erreur:", error);
    }
    console.log("Email envoyé:", info.response);
});
