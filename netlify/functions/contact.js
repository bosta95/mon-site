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

// Charger et compiler le template contact
function getContactTemplate() {
  try {
    // Le chemin vers le template depuis la fonction Netlify
    const templatePath = path.join(__dirname, '../../templates/contact-message.html');
    console.log('📂 Chemin template:', templatePath);
    
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    return handlebars.compile(templateSource);
  } catch (error) {
    console.error('❌ Erreur chargement template:', error);
    // Template de fallback simple si le fichier n'est pas trouvé
    return handlebars.compile(`
      <h2>Nouveau message de contact</h2>
      <p><strong>Nom:</strong> {{name}}</p>
      <p><strong>Email:</strong> {{email}}</p>
      <p><strong>Sujet:</strong> {{subject}}</p>
      <p><strong>Date:</strong> {{date}}</p>
      <div><strong>Message:</strong><br>{{message}}</div>
    `);
  }
}

exports.handler = async function(event, context) {
  console.log('=== FONCTION CONTACT AVEC TEMPLATE ===');
  console.log('Méthode:', event.httpMethod);
  
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    console.log('📥 Parsing du body...');
    const { name, email, subject, message } = JSON.parse(event.body);
    console.log('✅ Données reçues:', { name, email, subject });

    // Validation
    if (!name || !email || !subject || !message) {
      console.log('❌ Champs manquants');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Tous les champs sont requis' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    if (!isValidEmail(email)) {
      console.log('❌ Email invalide:', email);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Format d\'email invalide' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    const sanitizedName = sanitizeInput(name);
    const sanitizedSubject = sanitizeInput(subject);
    const sanitizedMessage = sanitizeInput(message);

    // Vérification des variables SMTP
    console.log('🔧 Variables SMTP:');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_USER:', process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 5) + '***' : 'MANQUANT');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'CONFIGURÉ' : 'MANQUANT');

    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('❌ Variables SMTP manquantes');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Configuration SMTP manquante' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    console.log('📧 Création du transporteur SMTP...');
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true, // Pour port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    console.log('📝 Chargement du template...');
    const template = getContactTemplate();

    const adminEmail = process.env.ADMIN_EMAIL || process.env.MERCHANT_EMAIL || 'contact@iptvsmarterpros.com';
    console.log('📬 Envoi vers:', adminEmail);

    // Préparer les données pour le template
    const templateData = {
      name: sanitizedName,
      email: email,
      subject: sanitizedSubject,
      message: sanitizedMessage,
      date: new Date().toLocaleString('fr-FR')
    };

    console.log('🎨 Génération du HTML avec template...');
    const htmlContent = template(templateData);

    const emailOptions = {
      from: `"IPTV Smarter Pro" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `[Contact] ${sanitizedSubject}`,
      html: htmlContent
    };

    console.log('🚀 Envoi de l\'email...');
    const info = await transporter.sendMail(emailOptions);
    console.log('✅ Email envoyé ! ID:', info.messageId);
    console.log('📨 Réponse SMTP:', info.response);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Message envoyé avec succès' }),
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (error) {
    console.error('❌ ERREUR:', error);
    console.error('📍 Stack:', error.stack);
    
    // Diagnostics spécifiques
    if (error.message.includes('EAUTH')) {
      console.error('🔧 Problème d\'authentification SMTP - Vérifiez SMTP_USER et SMTP_PASS');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('🔧 Problème de connexion SMTP - Vérifiez SMTP_HOST et SMTP_PORT');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('🔧 Problème DNS - Vérifiez SMTP_HOST');
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erreur lors de l\'envoi',
        details: error.message
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}; 