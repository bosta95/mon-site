const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  console.log('=== DIAGNOSTIC NAMECHEAP ULTRA-DÉTAILLÉ ===');
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    console.log('📋 VÉRIFICATION COMPLÈTE...');
    
    // Variables d'environnement
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    
    console.log('🔧 Variables:');
    console.log('- SMTP_HOST:', smtpHost || 'MANQUANT');
    console.log('- SMTP_PORT:', smtpPort || 'MANQUANT'); 
    console.log('- SMTP_USER:', smtpUser || 'MANQUANT');
    console.log('- SMTP_PASS:', smtpPass ? 'CONFIGURÉ' : 'MANQUANT');

    if (!smtpHost || !smtpUser || !smtpPass) {
      const missing = [];
      if (!smtpHost) missing.push('SMTP_HOST');
      if (!smtpUser) missing.push('SMTP_USER');
      if (!smtpPass) missing.push('SMTP_PASS');
      
      console.log('❌ Variables manquantes:', missing);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: `Variables Netlify manquantes: ${missing.join(', ')}`,
          details: 'Allez dans Netlify > Site settings > Environment variables'
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    console.log('📧 Test de connexion Namecheap...');
    
    const transporter = nodemailer.createTransporter({
      host: smtpHost,
      port: parseInt(smtpPort) || 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    console.log('🔍 Test verify()...');
    await transporter.verify();
    console.log('✅ Verify réussi !');

    console.log('📮 Test envoi email...');
    const result = await transporter.sendMail({
      from: `"Test IPTV" <${smtpUser}>`,
      to: smtpUser,
      subject: 'Test depuis Netlify',
      text: 'Si vous recevez ceci, Namecheap fonctionne !'
    });

    console.log('✅ EMAIL ENVOYÉ !');
    console.log('Message ID:', result.messageId);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: '🎉 SUCCÈS TOTAL ! Namecheap fonctionne parfaitement avec Netlify !',
        messageId: result.messageId,
        config: `${smtpHost}:${smtpPort}`,
        user: smtpUser
      }),
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (error) {
    console.error('❌ ERREUR COMPLÈTE:', error);
    console.error('Type:', typeof error);
    console.error('Name:', error.name);
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Command:', error.command);
    console.error('Response:', error.response);
    console.error('Stack:', error.stack);

    // Analyse de l'erreur avec tous les détails
    let errorMessage = 'Erreur inconnue';
    let solution = '';
    
    if (error.code) {
      switch(error.code) {
        case 'EAUTH':
          errorMessage = '🔐 ERREUR AUTHENTIFICATION: Email ou mot de passe incorrect';
          solution = 'Vérifiez vos identifiants Namecheap';
          break;
        case 'ECONNREFUSED':
          errorMessage = '🚫 CONNEXION REFUSÉE: Netlify bloque probablement SMTP';
          solution = 'Netlify a peut-être bloqué SMTP récemment';
          break;
        case 'ETIMEDOUT':
          errorMessage = '⏰ TIMEOUT: Problème de réseau ou firewall';
          solution = 'Connexion trop lente ou bloquée';
          break;
        case 'ENOTFOUND':
          errorMessage = '🔍 SERVEUR INTROUVABLE: Problème DNS';
          solution = 'Vérifiez SMTP_HOST = mail.privateemail.com';
          break;
        default:
          errorMessage = `❓ ERREUR CODE ${error.code}: ${error.message}`;
          solution = 'Erreur technique spécifique';
      }
    } else {
      errorMessage = `💥 ERREUR SYSTÈME: ${error.message}`;
      solution = 'Problème interne NodeJS/Netlify';
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: errorMessage,
        solution: solution,
        technical: {
          code: error.code,
          message: error.message,
          command: error.command,
          response: error.response
        },
        config: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER
        }
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}; 