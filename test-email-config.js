const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailConfig() {
  console.log('🧪 Test de configuration email...\n');
  
  // Vérifier les variables d'environnement
  console.log('📋 Variables d\'environnement:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || '❌ MANQUANT');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || '❌ MANQUANT');
  console.log('SMTP_USER:', process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 5) + '***' : '❌ MANQUANT');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✅ CONFIGURÉ' : '❌ MANQUANT');
  console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL || '❌ MANQUANT');
  
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n❌ Variables SMTP manquantes !');
    console.log('💡 Configurez vos variables d\'environnement dans Netlify ou dans un fichier .env');
    return;
  }
  
  try {
    console.log('\n🔧 Test de connexion SMTP...');
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT == '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    // Test de connexion
    await transporter.verify();
    console.log('✅ Connexion SMTP réussie !');
    
    // Test d'envoi d'email
    console.log('\n📧 Test d\'envoi d\'email...');
    const testEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    
    const info = await transporter.sendMail({
      from: `"Test IPTV" <${process.env.SMTP_USER}>`,
      to: testEmail,
      subject: '🧪 Test de configuration email - IPTV Smarter Pros',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Test de configuration email</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
            <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
            <p><strong>Statut:</strong> ✅ Configuration email fonctionnelle</p>
            <p>Si vous recevez cet email, votre système de messagerie est correctement configuré !</p>
          </div>
        </div>
      `
    });
    
    console.log('✅ Email de test envoyé avec succès !');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Vérifiez votre boîte mail:', testEmail);
    
  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    
    if (error.message.includes('EAUTH')) {
      console.log('💡 Problème d\'authentification - Vérifiez SMTP_USER et SMTP_PASS');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Problème de connexion - Vérifiez SMTP_HOST et SMTP_PORT');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Problème DNS - Vérifiez SMTP_HOST');
    }
  }
}

testEmailConfig(); 