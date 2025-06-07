const nodemailer = require('nodemailer');

function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

exports.handler = async function(event, context) {
  console.log('=== TEST NAMECHEAP DÉTAILLÉ ===');
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    // Affichage des variables (sans révéler le mot de passe)
    console.log('🔧 VARIABLES CONFIGURÉES:');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? `${process.env.SMTP_PASS.substring(0, 3)}***` : 'MANQUANT');

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Variables Netlify manquantes',
          missing: {
            host: !process.env.SMTP_HOST,
            user: !process.env.SMTP_USER, 
            pass: !process.env.SMTP_PASS
          }
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Test avec la configuration exacte Namecheap
    console.log('📧 TEST CONNEXION NAMECHEAP...');
    
    const transporter = nodemailer.createTransporter({
      host: 'mail.privateemail.com', // Forcé pour être sûr
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false // Au cas où il y aurait un problème de certificat
      },
      debug: true, // Active les logs détaillés
      logger: true
    });

    // Test de vérification
    console.log('🔍 Vérification de la connexion...');
    await transporter.verify();
    console.log('✅ CONNEXION NAMECHEAP RÉUSSIE !');

    // Test d'envoi réel
    console.log('📮 Test d\'envoi réel...');
    const info = await transporter.sendMail({
      from: `"IPTV Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Envoi à soi-même pour tester
      subject: 'Test Namecheap depuis Netlify',
      html: `
        <h2>Test réussi !</h2>
        <p>Ce message confirme que Namecheap fonctionne avec Netlify.</p>
        <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
        <p>Serveur: ${process.env.SMTP_HOST}</p>
      `
    });

    console.log('✅ EMAIL ENVOYÉ !');
    console.log('📨 Message ID:', info.messageId);
    console.log('📨 Réponse:', info.response);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'SUCCESS - Namecheap fonctionne parfaitement !',
        messageId: info.messageId,
        response: info.response
      }),
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (error) {
    console.error('❌ ERREUR DÉTAILLÉE:', error);
    console.error('📍 Code:', error.code);
    console.error('📍 Command:', error.command);
    console.error('📍 Response:', error.response);
    console.error('📍 Stack:', error.stack);
    
    // Analyse de l'erreur
    let diagnosis = 'Erreur inconnue';
    let solution = '';
    
    if (error.code === 'EAUTH') {
      diagnosis = 'PROBLÈME D\'AUTHENTIFICATION';
      solution = 'Vérifiez le mot de passe dans Namecheap > Private Email';
    } else if (error.code === 'ECONNREFUSED') {
      diagnosis = 'CONNEXION REFUSÉE';
      solution = 'Netlify bloque peut-être SMTP, ou problème de port';
    } else if (error.code === 'ETIMEDOUT') {
      diagnosis = 'TIMEOUT DE CONNEXION';
      solution = 'Problème réseau ou firewall';
    } else if (error.code === 'ENOTFOUND') {
      diagnosis = 'SERVEUR INTROUVABLE';
      solution = 'Vérifiez SMTP_HOST = mail.privateemail.com';
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: diagnosis,
        details: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        solution: solution,
        smtp_config: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER
        }
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}; 