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
  // Vérification de la méthode HTTP
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
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

    const { name, email, subject, message } = JSON.parse(event.body);

    // Validation des entrées
    if (!name || !email || !subject || !message) {
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

    // Assainissement des entrées
    const sanitizedName = sanitizeInput(name);
    const sanitizedSubject = sanitizeInput(subject);
    const sanitizedMessage = sanitizeInput(message);

    // Utiliser email-utils pour envoyer l'email de contact à l'admin
    await emailUtils.sendTemplateEmail({
      to: process.env.ADMIN_EMAIL || process.env.MERCHANT_EMAIL || 'contact@iptvsmarterpros.com',
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

    // Optionnel : Envoyer un email de confirmation au client
    // (Vous pouvez décommenter si vous voulez une confirmation automatique)
    /*
    await emailUtils.sendTemplateEmail({
      to: email,
      subject: 'Confirmation de réception - IPTV Smarter Pros',
      templateName: 'contact-confirmation',
      data: {
        name: sanitizedName,
        subject: sanitizedSubject
      }
    });
    */

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Message envoyé avec succès' }),
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (error) {
    console.error('Erreur lors de l\'envoi du message de contact:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erreur lors de l\'envoi du message' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}; 