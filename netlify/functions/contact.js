const path = require('path');

// Chemin vers email-utils depuis le dossier netlify/functions
const emailUtils = require('../../email-utils');

function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

function sanitizeInput(input) {
  if (!input) return '';
  return input.toString().trim().slice(0, 1000); // Limiter la longueur
}

exports.handler = async function(event, context) {
  console.log('=== DÉBUT TRAITEMENT CONTACT ===');
  console.log('Méthode HTTP:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers, null, 2));
  
  // Vérification de la méthode HTTP
  if (event.httpMethod !== 'POST') {
    console.log('❌ Méthode non autorisée:', event.httpMethod);
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  }

  try {
    // Validation du Content-Type
    const contentType = event.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      console.log('❌ Content-Type invalide:', contentType);
      return {
        statusCode: 415,
        body: JSON.stringify({ error: 'Content-Type doit être application/json' }),
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }

    const { name, email, subject, message } = JSON.parse(event.body);
    console.log('Données reçues:', { name, email, subject, message: message?.substring(0, 50) + '...' });

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

    // Utiliser email-utils pour envoyer l'email de contact à l'admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.MERCHANT_EMAIL || 'contact@iptvsmarterpros.com';
    console.log('📧 Envoi email à:', adminEmail);
    
    await emailUtils.sendTemplateEmail({
      to: adminEmail,
      subject: `[Contact] ${sanitizedSubject}`,
      templateName: 'contact-message',
      data: {
        name: sanitizedName,
        email: email,
        subject: sanitizedSubject,
        message: sanitizedMessage,
        date: new Date().toLocaleString('fr-FR')
      }
    });

    console.log('✅ Email envoyé avec succès');

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