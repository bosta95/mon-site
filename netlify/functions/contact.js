const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email, subject, message } = JSON.parse(event.body);

    // Configuration du transporteur email
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    };

    const transporter = nodemailer.createTransport(smtpConfig);

    // Vérification de la connexion SMTP
    await transporter.verify();

    // Email à l'administrateur
    const adminEmail = await transporter.sendMail({
      from: `"IPTV Contact" <${process.env.SMTP_USER}>`,
      to: process.env.MERCHANT_EMAIL,
      subject: `Nouveau message de contact - ${subject}`,
      html: `
        <h1>Nouveau message de contact</h1>
        <p><strong>De :</strong> ${email}</p>
        <p><strong>Sujet :</strong> ${subject}</p>
        <p><strong>Message :</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    });

    // Email de confirmation au client
    const clientEmail = await transporter.sendMail({
      from: `"IPTV Smarter Pros" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Confirmation de réception de votre message - IPTV Smarter Pros',
      html: `
        <h1>Nous avons bien reçu votre message</h1>
        <p>Cher client,</p>
        <p>Nous confirmons la réception de votre message concernant "${subject}".</p>
        <p>Notre équipe vous répondra dans les plus brefs délais.</p>
        <p>Cordialement,<br>L'équipe IPTV Smarter Pros</p>
      `
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Emails envoyés avec succès' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erreur lors de l\'envoi des emails' })
    };
  }
}; 