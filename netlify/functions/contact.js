const nodemailer = require('nodemailer');

function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

exports.handler = async function(event, context) {
  console.log('=== DEBUG CONTACT ===');
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
    const data = JSON.parse(event.body);
    console.log('✅ Données parsées:', data);

    // Test 1: Vérification des variables d'environnement
    console.log('🔧 TEST VARIABLES SMTP:');
    console.log('SMTP_HOST:', process.env.SMTP_HOST || 'MANQUANT');
    console.log('SMTP_PORT:', process.env.SMTP_PORT || 'MANQUANT');
    console.log('SMTP_USER:', process.env.SMTP_USER || 'MANQUANT');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'CONFIGURÉ' : 'MANQUANT');
    console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'MANQUANT');

    // Test 2: Est-ce que nodemailer est disponible ?
    console.log('📦 TEST NODEMAILER:');
    try {
      const nodemailer = require('nodemailer');
      console.log('✅ Nodemailer importé avec succès');
      console.log('Version:', nodemailer.version || 'inconnue');
    } catch (err) {
      console.error('❌ Erreur import nodemailer:', err.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Nodemailer non disponible',
          details: err.message 
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Test des variables manquantes
    const missingVars = [];
    if (!process.env.SMTP_HOST) missingVars.push('SMTP_HOST');
    if (!process.env.SMTP_PORT) missingVars.push('SMTP_PORT');
    if (!process.env.SMTP_USER) missingVars.push('SMTP_USER');
    if (!process.env.SMTP_PASS) missingVars.push('SMTP_PASS');

    if (missingVars.length > 0) {
      console.log('❌ Variables manquantes:', missingVars);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Variables SMTP manquantes',
          missing: missingVars,
          help: 'Vérifiez la configuration dans Netlify > Site settings > Environment variables'
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Test 3: Création du transporteur (sans envoi)
    console.log('🚛 TEST CREATION TRANSPORTEUR:');
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      console.log('✅ Transporteur créé');
      
      // Test de vérification de connexion
      console.log('🔍 TEST CONNEXION SMTP...');
      await transporter.verify();
      console.log('✅ Connexion SMTP réussie !');
      
    } catch (err) {
      console.error('❌ Erreur transporteur/connexion:', err.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Erreur connexion SMTP',
          details: err.message,
          code: err.code || 'UNKNOWN'
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Si on arrive ici, tout fonctionne !
    console.log('🎉 TOUS LES TESTS PASSÉS !');
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Test réussi - Configuration OK',
        smtp_host: process.env.SMTP_HOST,
        smtp_user: process.env.SMTP_USER
      }),
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (error) {
    console.error('❌ ERREUR GLOBALE:', error);
    console.error('📍 Stack:', error.stack);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erreur de test',
        details: error.message,
        stack: error.stack
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}; 