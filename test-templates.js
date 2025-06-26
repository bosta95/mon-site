const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
require('dotenv').config();

// Fonction pour charger et compiler les templates
function getTemplate(templateName) {
  try {
    const templatePath = path.join(__dirname, 'public', 'templates', `${templateName}.html`);
    console.log(`📂 Chargement template ${templateName} depuis:`, templatePath);
    
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    return handlebars.compile(templateSource);
  } catch (error) {
    console.error(`❌ Erreur chargement template ${templateName}:`, error);
    return null;
  }
}

async function testTemplates() {
  console.log('🧪 Test des nouveaux templates premium...\n');
  
  // Vérifier la configuration SMTP
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('❌ Variables SMTP manquantes !');
    console.log('💡 Configurez vos variables d\'environnement dans le fichier .env');
    return;
  }
  
  try {
    console.log('🔧 Création du transporteur SMTP...');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT == '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    const testEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    
    // Test 1: Template de confirmation de commande
    console.log('\n📧 Test 1: Template confirmation de commande...');
    const orderTemplate = getTemplate('order-confirmation');
    if (orderTemplate) {
      const orderData = {
        productName: 'Abonnement IPTV Premium 12 Mois',
        productDescription: 'Accès complet pendant 12 mois - Plus de 22 000 chaînes et 50 000 VOD',
        productPrice: '29.99€',
        orderNumber: 'IPTV-1703123456789-ABC12',
        orderDate: new Date().toLocaleString('fr-FR')
      };
      
      const orderHtml = orderTemplate(orderData);
      
      await transporter.sendMail({
        from: `"IPTV Smarter Pro" <${process.env.SMTP_USER}>`,
        to: testEmail,
        subject: '🧪 Test - Confirmation de commande (Nouveau Design)',
        html: orderHtml
      });
      
      console.log('✅ Email de confirmation envoyé !');
    }
    
    // Test 2: Template notification admin
    console.log('\n📧 Test 2: Template notification admin...');
    const adminTemplate = getTemplate('admin-notification');
    if (adminTemplate) {
      const adminData = {
        clientEmail: 'client@example.com',
        productName: 'Abonnement IPTV Premium 6 Mois',
        productPrice: '19.99€',
        orderNumber: 'IPTV-1703123456789-DEF34',
        orderDate: new Date().toLocaleDateString('fr-FR'),
        orderTime: new Date().toLocaleTimeString('fr-FR'),
        paymentMethod: 'PayPal'
      };
      
      const adminHtml = adminTemplate(adminData);
      
      await transporter.sendMail({
        from: `"IPTV Smarter Pro" <${process.env.SMTP_USER}>`,
        to: testEmail,
        subject: '🧪 Test - Notification admin (Nouveau Design)',
        html: adminHtml
      });
      
      console.log('✅ Email de notification admin envoyé !');
    }
    
    // Test 3: Template message de contact
    console.log('\n📧 Test 3: Template message de contact...');
    const contactTemplate = getTemplate('contact-message');
    if (contactTemplate) {
      const contactData = {
        name: 'Jean Dupont',
        email: 'jean.dupont@example.com',
        subject: 'Question sur l\'abonnement IPTV',
        message: 'Bonjour,\n\nJ\'aimerais savoir si votre service IPTV fonctionne sur Smart TV Samsung ?\n\nMerci pour votre réponse.\n\nCordialement,\nJean Dupont',
        date: new Date().toLocaleString('fr-FR')
      };
      
      const contactHtml = contactTemplate(contactData);
      
      await transporter.sendMail({
        from: `"IPTV Smarter Pro" <${process.env.SMTP_USER}>`,
        to: testEmail,
        subject: '🧪 Test - Message de contact (Nouveau Design)',
        html: contactHtml
      });
      
      console.log('✅ Email de contact envoyé !');
    }
    
    console.log('\n🎉 Tous les tests terminés avec succès !');
    console.log('📬 Vérifiez votre boîte mail:', testEmail);
    console.log('\n✨ Vos templates premium sont maintenant opérationnels !');
    
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
  }
}

testTemplates(); 