const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
require('dotenv').config();

// Configuration des produits - CODES RÉELS DU SITE
const PRODUCTS = {
  // Codes pour les abonnements de base
  'Premium_IPTV_3_mois': {
    name: 'Abonnement IPTV Premium 3 Mois',
    description: 'Accès complet pendant 3 mois - Plus de 22 000 chaînes et 50 000 VOD',
    price: '9.99€'
  },
  'Premium_IPTV_6_mois': {
    name: 'Abonnement IPTV Premium 6 Mois',
    description: 'Accès complet pendant 6 mois - Plus de 22 000 chaînes et 50 000 VOD',
    price: '19.99€'
  },
  'Premium_IPTV_12_mois': {
    name: 'Abonnement IPTV Premium 12 Mois',
    description: 'Accès complet pendant 12 mois - Plus de 22 000 chaînes et 50 000 VOD',
    price: '29.99€'
  },
  // Codes pour les abonnements multi-écrans
  'Premium_IPTV_2_ecrans': {
    name: 'Abonnement IPTV Premium 12 Mois - 2 Écrans',
    description: 'Accès complet pour 2 écrans en simultané',
    price: '59.99€'
  },
  'Premium_IPTV_3_ecrans': {
    name: 'Abonnement IPTV Premium 12 Mois - 3 Écrans',
    description: 'Accès complet pour 3 écrans en simultané',
    price: '79.99€'
  },
  'Premium_IPTV_4_ecrans': {
    name: 'Abonnement IPTV Premium 12 Mois - 4 Écrans',
    description: 'Accès complet pour 4 écrans en simultané',
    price: '99.99€'
  }
};

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

// Fonction pour détecter le nombre d'écrans
function detectScreenCount(product) {
  if (product.includes('2_ecrans') || product.includes('2ecrans')) {
    return { count: 2, info: '2 écrans simultanés' };
  } else if (product.includes('3_ecrans') || product.includes('3ecrans')) {
    return { count: 3, info: '3 écrans simultanés' };
  } else if (product.includes('4_ecrans') || product.includes('4ecrans')) {
    return { count: 4, info: '4 écrans simultanés' };
  } else {
    return { count: 1, info: '1 écran' };
  }
}

async function testDifferentOffers() {
  console.log('🧪 Test des différentes offres avec écrans multiples...\n');
  
  // Vérifier la configuration SMTP
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('❌ Variables SMTP manquantes !');
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
    
    // Test des différentes offres
    const testOffers = [
      'Premium_IPTV_3_mois',
      'Premium_IPTV_6_mois', 
      'Premium_IPTV_12_mois',
      'Premium_IPTV_2_ecrans',
      'Premium_IPTV_3_ecrans',
      'Premium_IPTV_4_ecrans'
    ];
    
    for (let i = 0; i < testOffers.length; i++) {
      const product = testOffers[i];
      const productInfo = PRODUCTS[product];
      const screenInfo = detectScreenCount(product);
      
      console.log(`\n📧 Test ${i + 1}: ${productInfo.name}`);
      console.log(`📺 Écrans: ${screenInfo.info}`);
      console.log(`💰 Prix: ${productInfo.price}`);
      
      // Amélioration de la description avec le nombre d'écrans
      const enhancedDescription = productInfo.description.includes('écrans') 
        ? productInfo.description 
        : `${productInfo.description} - ${screenInfo.info}`;
      
      // Test confirmation client
      const orderTemplate = getTemplate('order-confirmation');
      if (orderTemplate) {
        const orderData = {
          productName: productInfo.name,
          productDescription: enhancedDescription,
          productPrice: productInfo.price,
          orderNumber: `IPTV-TEST-${Date.now()}-${i}`,
          orderDate: new Date().toLocaleString('fr-FR')
        };
        
        const orderHtml = orderTemplate(orderData);
        
        await transporter.sendMail({
          from: `"IPTV Smarter Pro" <${process.env.SMTP_USER}>`,
          to: testEmail,
          subject: `🧪 Test ${i + 1} - ${productInfo.name} (${screenInfo.info})`,
          html: orderHtml
        });
        
        console.log('✅ Email de confirmation envoyé !');
      }
      
      // Test notification admin
      const adminTemplate = getTemplate('admin-notification');
      if (adminTemplate) {
        const adminData = {
          clientEmail: 'client-test@example.com',
          productName: productInfo.name,
          productDescription: enhancedDescription,
          productPrice: productInfo.price,
          orderNumber: `IPTV-TEST-${Date.now()}-${i}`,
          orderDate: new Date().toLocaleDateString('fr-FR'),
          orderTime: new Date().toLocaleTimeString('fr-FR'),
          paymentMethod: 'PayPal'
        };
        
        const adminHtml = adminTemplate(adminData);
        
        await transporter.sendMail({
          from: `"IPTV Smarter Pro" <${process.env.SMTP_USER}>`,
          to: testEmail,
          subject: `🧪 Test Admin ${i + 1} - ${productInfo.name} (${screenInfo.info})`,
          html: adminHtml
        });
        
        console.log('✅ Email de notification admin envoyé !');
      }
      
      // Pause entre les tests
      if (i < testOffers.length - 1) {
        console.log('⏳ Pause de 2 secondes...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n🎉 Tous les tests terminés avec succès !');
    console.log('📬 Vérifiez votre boîte mail:', testEmail);
    console.log('\n📊 Résumé des tests :');
    console.log('• 3 offres de base (1 écran)');
    console.log('• 3 offres multi-écrans (2, 3, 4 écrans)');
    console.log('• Chaque offre testée en confirmation client ET notification admin');
    
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
  }
}

testDifferentOffers(); 