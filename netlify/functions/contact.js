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
    const testResults = [];
    
    try {
      const nodemailer = require('nodemailer');
      
      // Test avec différentes configurations
      const configurations = [
        { name: 'Port 465 SSL', port: 465, secure: true, requireTLS: false },
        { name: 'Port 587 STARTTLS', port: 587, secure: false, requireTLS: true },
        { name: 'Port 25 Plain', port: 25, secure: false, requireTLS: false }
      ];
      
      for (const config of configurations) {
        console.log(`🔧 Test ${config.name}...`);
        try {
          const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: config.port,
            secure: config.secure,
            requireTLS: config.requireTLS,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            },
            timeout: 10000, // 10 secondes de timeout
            debug: true
          });
          
          await transporter.verify();
          console.log(`✅ ${config.name}: SUCCÈS`);
          testResults.push({ config: config.name, status: 'SUCCESS' });
          break; // Si une config marche, on s'arrête
          
        } catch (err) {
          console.log(`❌ ${config.name}: ${err.message}`);
          console.log(`📍 Code: ${err.code}`);
          console.log(`📍 Errno: ${err.errno}`);
          console.log(`📍 Syscall: ${err.syscall}`);
          
          testResults.push({ 
            config: config.name, 
            status: 'FAILED',
            code: err.code,
            message: err.message,
            errno: err.errno,
            syscall: err.syscall
          });
        }
      }
      
      // Si aucune config ne marche
      if (testResults.every(r => r.status === 'FAILED')) {
        console.error('❌ TOUTES LES CONFIGURATIONS ÉCHOUENT');
        console.log('📊 Résumé des tests:', JSON.stringify(testResults, null, 2));
        
        // Analysons les erreurs
        const errorAnalysis = [];
        if (testResults.some(r => r.code === 'ECONNREFUSED')) {
          errorAnalysis.push('🚫 ECONNREFUSED: Netlify bloque probablement les connexions SMTP sortantes');
        }
        if (testResults.some(r => r.code === 'ETIMEDOUT')) {
          errorAnalysis.push('⏰ ETIMEDOUT: Timeout réseau, possible restriction firewall');
        }
        if (testResults.some(r => r.code === 'ENOTFOUND')) {
          errorAnalysis.push('🔍 ENOTFOUND: Serveur SMTP introuvable, vérifiez SMTP_HOST');
        }
        if (testResults.some(r => r.code === 'EAUTH')) {
          errorAnalysis.push('🔐 EAUTH: Problème d\'authentification, vérifiez SMTP_USER/SMTP_PASS');
        }
        
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: 'Toutes les configurations SMTP échouent',
            testResults: testResults,
            analysis: errorAnalysis,
            solution: 'Netlify bloque probablement SMTP. Solutions: 1) Utiliser SendGrid/Mailgun, 2) Contacter Netlify support, 3) Utiliser un webhook Zapier',
            smtp_host: process.env.SMTP_HOST,
            smtp_user: process.env.SMTP_USER
          }),
          headers: { 'Content-Type': 'application/json' }
        };
      }
      
      console.log('✅ Au moins une configuration fonctionne');
      
    } catch (err) {
      console.error('❌ Erreur globale transporteur:', err.message);
      console.error('📍 Stack:', err.stack);
      
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Erreur globale lors des tests SMTP',
          details: err.message,
          stack: err.stack,
          testResults: testResults
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