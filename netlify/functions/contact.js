const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');

function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

function sanitizeInput(input) {
  if (!input) return '';
  return input.toString().trim().slice(0, 1000);
}

// Créer le transporteur SMTP
function createTransporter() {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: true, // Pour le port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// Template email simple intégré
function getContactEmailTemplate(data) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nouveau message de contact</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
        <h2 style="color: #333;">Nouveau message de contact</h2>
        <p><strong>Nom:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Sujet:</strong> ${data.subject}</p>
        <p><strong>Date:</strong> ${data.date}</p>
        <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 15px;">
            <h3>Message:</h3>
            <p style="white-space: pre-wrap;">${data.message}</p>
        </div>
    </div>
</body>
</html>`;
}

exports.handler = async function(event, context) {
  console.log('=== DÉBUT TRAITEMENT CONTACT ===');
  console.log('Méthode HTTP:', event.httpMethod);
  
  // Vérification de la méthode HTTP
  if (event.httpMethod !== 'POST') {
    console.log('❌ Méthode non autorisée:', event.httpMethod);
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }

  try {
    // Parse des données
    const { name, email, subject, message } = JSON.parse(event.body);
    console.log('Données reçues:', { name, email, subject });

    // Validation des entrées
    if (!name || !email || !subject || !message) {
      console.log('❌ Champs manquants');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Tous les champs sont requis' }),
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }

    if (!isValidEmail(email)) {
      console.log('❌ Email invalide:', email);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Format d\'email invalide' }),
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }

    // Assainissement des entrées
    const sanitizedName = sanitizeInput(name);
    const sanitizedSubject = sanitizeInput(subject);
    const sanitizedMessage = sanitizeInput(message);

    console.log('🔧 Configuration SMTP:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 5) + '***' : 'NON CONFIGURÉ'
    });

    // Créer le transporteur
    const transporter = createTransporter();
    
    // Préparer l'email
    const adminEmail = process.env.ADMIN_EMAIL || process.env.MERCHANT_EMAIL || 'contact@iptvsmarterpros.com';
    console.log('📧 Envoi email à:', adminEmail);
    
    const emailData = {
      name: sanitizedName,
      email: email,
      subject: sanitizedSubject,
      message: sanitizedMessage,
      date: new Date().toLocaleString('fr-FR')
    };
    
    const emailOptions = {
      from: `"IPTV Smarter Pro" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `[Contact] ${sanitizedSubject}`,
      html: getContactEmailTemplate(emailData)
    };
    
    // Envoyer l'email
    const info = await transporter.sendMail(emailOptions);
    console.log('✅ Email envoyé avec succès, ID:', info.messageId);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Message envoyé avec succès' }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };

  } catch (error) {
    console.error('❌ ERREUR lors de l\'envoi du message de contact:', error);
    console.error('Stack trace:', error.stack);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erreur lors de l\'envoi du message',
        details: error.message 
      }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
}; 