const nodemailer = require('nodemailer');

function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

exports.handler = async function(event, context) {
  console.log('=== CONTACT SIMPLIFIÉ ===');
  console.log('Méthode:', event.httpMethod);
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    console.log('📥 Body reçu:', event.body);
    const { name, email, subject, message } = JSON.parse(event.body);
    console.log('✅ Données parsées:', { name, email, subject });

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

    // Vérification SMTP
    console.log('🔧 Variables SMTP:');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_USER:', process.env.SMTP_USER ? 'CONFIGURÉ' : 'MANQUANT');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'CONFIGURÉ' : 'MANQUANT');

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('❌ Configuration SMTP incomplète');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Configuration SMTP manquante' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    console.log('📧 Création transporteur...');
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Test de connexion
    console.log('🔍 Test de connexion SMTP...');
    await transporter.verify();
    console.log('✅ Connexion SMTP OK');

    // Email simple sans template
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Nouveau message de contact</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <p><strong>Nom:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Sujet:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <div style="background: white; padding: 15px; border-radius: 4px;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
        </div>
      </div>
    `;

    console.log('📧 Envoi email...');
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    
    await transporter.sendMail({
      from: `"IPTV Smarter Pro" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `Contact: ${subject}`,
      html: emailHTML,
      replyTo: email
    });

    console.log('✅ Email envoyé avec succès');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Message envoyé avec succès' }),
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (error) {
    console.error('❌ ERREUR:', error);
    console.error('📍 Stack:', error.stack);
    
    // Diagnostics
    let errorMsg = 'Erreur lors de l\'envoi';
    if (error.message.includes('EAUTH')) {
      errorMsg = 'Erreur d\'authentification SMTP';
      console.error('🔧 Vérifiez SMTP_USER et SMTP_PASS');
    } else if (error.message.includes('ECONNREFUSED')) {
      errorMsg = 'Erreur de connexion SMTP';
      console.error('🔧 Vérifiez SMTP_HOST et SMTP_PORT');
    } else if (error.message.includes('ENOTFOUND')) {
      errorMsg = 'Serveur SMTP introuvable';
      console.error('🔧 Vérifiez SMTP_HOST');
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: errorMsg,
        details: error.message
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}; 