const nodemailer = require('nodemailer');
require('dotenv').config();

async function testSMTPConfiguration() {
  console.log('🔧 TEST DE CONFIGURATION SMTP NAMECHEAP');
  console.log('=========================================');
  
  // Vérification des variables d'environnement
  console.log('\n📋 Variables d\'environnement :');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || '❌ MANQUANT');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || '❌ MANQUANT');
  console.log('SMTP_USER:', process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 10) + '***' : '❌ MANQUANT');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✅ CONFIGURÉ (' + process.env.SMTP_PASS.length + ' caractères)' : '❌ MANQUANT');
  console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL || process.env.MERCHANT_EMAIL || '❌ MANQUANT');
  
  // Vérification que toutes les variables sont présentes
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n❌ ERREUR: Variables SMTP manquantes !');
    console.log('\nVeuillez configurer ces variables dans Netlify :');
    console.log('- SMTP_HOST (ex: mail.namecheap.com)');
    console.log('- SMTP_PORT (465 pour SSL ou 587 pour TLS)');  
    console.log('- SMTP_USER (votre email complet)');
    console.log('- SMTP_PASS (votre mot de passe email)');
    console.log('- ADMIN_EMAIL (email de destination des notifications)');
    return;
  }
  
  try {
    console.log('\n📧 Création du transporteur SMTP...');
    
    // Configuration pour Namecheap
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465', // true pour 465, false pour 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      debug: true, // Activer le debug
      logger: true // Activer les logs
    });
    
    console.log('✅ Transporteur créé');
    
    // Test de vérification de la connexion
    console.log('\n🔍 Test de connexion SMTP...');
    await transporter.verify();
    console.log('✅ Connexion SMTP réussie !');
    
    // Test d'envoi d'email
    console.log('\n📨 Test d\'envoi d\'email...');
    const testEmail = {
      from: `"IPTV Smarter Pro Test" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.MERCHANT_EMAIL || process.env.SMTP_USER,
      subject: '🧪 Test SMTP - IPTV Smarter Pros',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4CAF50;">✅ Test SMTP Réussi !</h2>
          <p>Ce message confirme que votre configuration SMTP fonctionne correctement.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Informations de configuration :</h3>
            <p><strong>Serveur:</strong> ${process.env.SMTP_HOST}</p>
            <p><strong>Port:</strong> ${process.env.SMTP_PORT}</p>
            <p><strong>Utilisateur:</strong> ${process.env.SMTP_USER}</p>
            <p><strong>Sécurisé:</strong> ${process.env.SMTP_PORT === '465' ? 'SSL' : 'TLS'}</p>
          </div>
          <p><strong>Date de test:</strong> ${new Date().toLocaleString('fr-FR')}</p>
          <p style="color: #666; font-size: 14px;">
            Si vous recevez cet email, votre messagerie fonctionne parfaitement !
          </p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(testEmail);
    
    console.log('✅ Email de test envoyé avec succès !');
    console.log('📧 Message ID:', info.messageId);
    console.log('📤 Réponse serveur:', info.response);
    
    console.log('\n🎉 TOUS LES TESTS RÉUSSIS !');
    console.log('Votre configuration SMTP Namecheap fonctionne correctement.');
    
  } catch (error) {
    console.error('\n❌ ERREUR lors du test SMTP:');
    console.error('Message:', error.message);
    
    // Diagnostics spécifiques
    if (error.code === 'EAUTH') {
      console.error('\n🔧 PROBLÈME D\'AUTHENTIFICATION:');
      console.error('- Vérifiez que SMTP_USER est votre email complet');
      console.error('- Vérifiez que SMTP_PASS est correct');
      console.error('- Assurez-vous que l\'authentification SMTP est activée chez Namecheap');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n🔧 PROBLÈME DE CONNEXION:');
      console.error('- Vérifiez SMTP_HOST (généralement mail.namecheap.com)');
      console.error('- Vérifiez SMTP_PORT (465 pour SSL, 587 pour TLS)');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n🔧 PROBLÈME DNS:');
      console.error('- Vérifiez que SMTP_HOST est correct');
      console.error('- Essayez: mail.namecheap.com');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n🔧 PROBLÈME DE TIMEOUT:');
      console.error('- Le serveur Namecheap peut être temporairement indisponible');
      console.error('- Essayez avec un autre port (587 au lieu de 465)');
    }
    
    console.error('\n📋 Configurations Namecheap courantes:');
    console.error('• Serveur SMTP: mail.namecheap.com');
    console.error('• Port SSL: 465 (secure: true)');
    console.error('• Port TLS: 587 (secure: false)');
    console.error('• Authentification: Requise');
  }
}

// Lancement du test
if (require.main === module) {
  testSMTPConfiguration();
}

module.exports = { testSMTPConfiguration }; 