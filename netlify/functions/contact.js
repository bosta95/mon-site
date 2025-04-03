const nodemailer = require('nodemailer');
const xss = require('xss');

// Validation des entrées
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

function sanitizeInput(input) {
  return xss(input.trim());
}

exports.handler = async function(event, context) {
  // Vérification de la méthode HTTP
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff'
      }
    };
  }

  try {
    // Validation du Content-Type
    const contentType = event.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      return {
        statusCode: 415,
        body: JSON.stringify({ error: 'Content-Type doit être application/json' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    const { email, subject, message } = JSON.parse(event.body);

    // Validation des entrées
    if (!email || !subject || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Tous les champs sont requis' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    if (!isValidEmail(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Format d\'email invalide' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    if (message.length > 1000 || subject.length > 200) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message ou sujet trop long' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Assainissement des entrées
    const sanitizedSubject = sanitizeInput(subject);
    const sanitizedMessage = sanitizeInput(message);

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
        minVersion: 'TLSv1.2',
        ciphers: 'HIGH:!aNULL:!MD5'
      }
    };

    const transporter = nodemailer.createTransport(smtpConfig);

    // Vérification de la connexion SMTP
    await transporter.verify();

    // Email à l'administrateur
    await transporter.sendMail({
      from: `"IPTV Contact" <${process.env.SMTP_USER}>`,
      to: process.env.MERCHANT_EMAIL,
      subject: `Nouveau message de contact - ${sanitizedSubject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50;">Nouveau message de contact</h1>
          <p><strong>De :</strong> ${email}</p>
          <p><strong>Sujet :</strong> ${sanitizedSubject}</p>
          <p><strong>Message :</strong></p>
          <p style="white-space: pre-wrap;">${sanitizedMessage}</p>
        </div>
      `
    });

    // Email de confirmation au client
    await transporter.sendMail({
      from: `"IPTV Smarter Pros" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Confirmation de réception de votre message - IPTV Smarter Pros',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50;">Nous avons bien reçu votre message</h1>
          <p>Cher client,</p>
          <p>Nous confirmons la réception de votre message concernant "${sanitizedSubject}".</p>
          <p>Notre équipe vous répondra dans les plus brefs délais.</p>
          <p>Cordialement,<br>L'équipe IPTV Smarter Pros</p>
        </div>
      `
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Emails envoyés avec succès' }),
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erreur lors de l\'envoi des emails' }),
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    };
  }
}; 