const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

// Fonction pour charger et compiler les templates
function getTemplate(templateName) {
  try {
    // Chemin corrigé pour les fonctions Netlify - pointe vers public/templates
    const templatePath = path.join(__dirname, '../..', 'public', 'templates', `${templateName}.html`);
    console.log(`📂 Chargement template ${templateName} depuis:`, templatePath);
    
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    return handlebars.compile(templateSource);
  } catch (error) {
    console.error(`❌ Erreur chargement template ${templateName}:`, error);
    
    // Template de fallback pour contact
    return handlebars.compile(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Message de Contact - IPTV Smarter Pros</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <p><strong>Nom:</strong> {{name}}</p>
          <p><strong>Email:</strong> {{email}}</p>
          <p><strong>Sujet:</strong> {{subject}}</p>
          <p><strong>Message:</strong></p>
          <div style="background: white; padding: 15px; border-radius: 4px; margin: 10px 0;">
            {{message}}
          </div>
          <p><strong>Date:</strong> {{date}}</p>
        </div>
      </div>
    `);
  }
}

exports.handler = async function(event, context) {
  console.log('=== FONCTION CONTACT NETLIFY ===');
  console.log('Méthode HTTP:', event.httpMethod);
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    const { name, email, subject, message } = JSON.parse(event.body);
    console.log('📧 Contact reçu de:', email);

    // Validation
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
        body: JSON.stringify({ error: 'Configuration SMTP incomplète' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Configuration SMTP Namecheap - CORRECTION de createTransporter -> createTransport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT == '465', // true pour port 465, false pour autres ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Préparer les données du template
    const templateData = {
      name,
      email,
      subject,
      message: message.replace(/\n/g, '<br>'),
      date: new Date().toLocaleString('fr-FR')
    };

    // Charger le template
    const template = getTemplate('contact-message');
    const emailHtml = template(templateData);

    // Email de destination admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.MERCHANT_EMAIL || process.env.SMTP_USER;
    console.log('📧 Envoi vers admin:', adminEmail);

    // Envoi de l'email à l'admin
    await transporter.sendMail({
      from: `"IPTV Smarter Pro" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `[Contact] ${subject}`,
      html: emailHtml,
      replyTo: email
    });

    console.log('✅ Email de contact envoyé avec succès');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Message envoyé avec succès' }),
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (error) {
    console.error('❌ Erreur envoi email contact:', error);
    console.error('📍 Stack:', error.stack);
    
    // Diagnostics spécifiques pour Namecheap
    if (error.message.includes('EAUTH')) {
      console.error('🔧 Problème d\'authentification SMTP - Vérifiez SMTP_USER et SMTP_PASS');
      console.error('💡 Pour Namecheap : Utilisez un mot de passe d\'application, pas votre mot de passe principal');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('🔧 Problème de connexion SMTP - Vérifiez SMTP_HOST et SMTP_PORT');
      console.error('💡 Pour Namecheap : SMTP_HOST=mail.privateemail.com, SMTP_PORT=465');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('🔧 Problème DNS - Vérifiez SMTP_HOST');
      console.error('💡 Pour Namecheap : Vérifiez l\'orthographe de mail.privateemail.com');
    } else if (error.message.includes('ETIMEDOUT')) {
      console.error('🔧 Timeout de connexion - Vérifiez votre connexion internet');
    } else if (error.message.includes('SELF_SIGNED_CERT')) {
      console.error('🔧 Problème de certificat SSL - Vérifiez la configuration secure');
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erreur lors de l\'envoi du message',
        details: error.message
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}; 