const nodemailer = require('nodemailer');
require('dotenv').config();

async function testContactForm() {
  console.log('🧪 Test spécifique du formulaire de contact...\n');
  
  // Vérifier les variables d'environnement
  console.log('📋 Variables d\'environnement:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || '❌ MANQUANT');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || '❌ MANQUANT');
  console.log('SMTP_USER:', process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 5) + '***' : '❌ MANQUANT');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✅ CONFIGURÉ' : '❌ MANQUANT');
  console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL || '❌ MANQUANT');
  
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n❌ Variables SMTP manquantes !');
    console.log('💡 Vérifiez que les variables sont configurées dans Netlify :');
    console.log('   - Site settings > Environment variables');
    console.log('   - SMTP_HOST = mail.privateemail.com');
    console.log('   - SMTP_PORT = 465');
    console.log('   - SMTP_USER = votre-email@votre-domaine.com');
    console.log('   - SMTP_PASS = votre-mot-de-passe-app');
    console.log('   - ADMIN_EMAIL = votre-email@votre-domaine.com');
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
    
    // Test d'envoi d'email de contact
    console.log('\n📧 Test d\'envoi d\'email de contact...');
    const testEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    
    const info = await transporter.sendMail({
      from: `"IPTV Smarter Pro" <${process.env.SMTP_USER}>`,
      to: testEmail,
      subject: '🧪 Test formulaire de contact - IPTV Smarter Pros',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Test formulaire de contact</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
            <p><strong>Nom:</strong> Test Utilisateur</p>
            <p><strong>Email:</strong> test@example.com</p>
            <p><strong>Sujet:</strong> Test du formulaire de contact</p>
            <p><strong>Message:</strong></p>
            <div style="background: white; padding: 15px; border-radius: 4px; margin: 10px 0;">
              Ceci est un test du formulaire de contact. Si vous recevez cet email, le système fonctionne correctement !
            </div>
            <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
          </div>
        </div>
      `
    });
    
    console.log('✅ Email de contact envoyé avec succès !');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Vérifiez votre boîte mail:', testEmail);
    
    console.log('\n🔍 Diagnostic :');
    console.log('✅ Configuration SMTP : OK');
    console.log('✅ Connexion SMTP : OK');
    console.log('✅ Envoi d\'email : OK');
    console.log('\n💡 Si le formulaire ne fonctionne toujours pas :');
    console.log('1. Vérifiez les logs Netlify Functions');
    console.log('2. Assurez-vous que l\'URL /.netlify/functions/contact est correcte');
    console.log('3. Vérifiez que les variables d\'environnement sont bien dans Netlify');
    
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

testContactForm(); 