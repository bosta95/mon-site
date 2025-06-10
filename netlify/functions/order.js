const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');

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
  // Codes pour les abonnements multi-écrans (exemple, à adapter)
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
  },
  // Codes de compatibilité (si utilisés par PayPal ou autre)
  '1month': {
    name: 'Abonnement IPTV 1 Mois',
    description: 'Accès complet pendant 1 mois',
    price: '15.99€'
  },
  '3months': {
    name: 'Abonnement IPTV 3 Mois',
    description: 'Accès complet pendant 3 mois',
    price: '29.99€'
  },
  '6months': {
    name: 'Abonnement IPTV 6 Mois',
    description: 'Accès complet pendant 6 mois',
    price: '49.99€'
  },
  '12months': {
    name: 'Abonnement IPTV 12 Mois',
    description: 'Accès complet pendant 12 mois',
    price: '79.99€'
  }
};

function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

function generateOrderNumber() {
  return 'IPTV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Charger et compiler les templates
function getTemplate(templateName) {
  try {
    // CORRECTION: Chemin correct pour les fonctions Netlify
    const templatePath = path.join(__dirname, '../..', 'templates', `${templateName}.html`);
    console.log(`📂 Chemin template ${templateName}:`, templatePath);
    
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    return handlebars.compile(templateSource);
  } catch (error) {
    console.error(`❌ Erreur chargement template ${templateName}:`, error);
    
    // Templates de fallback
    if (templateName === 'order-confirmation') {
      return handlebars.compile(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Confirmation de commande - IPTV Smarter Pros</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
            <p><strong>Produit:</strong> {{productName}}</p>
            <p><strong>Description:</strong> {{productDescription}}</p>
            <p><strong>Prix:</strong> {{productPrice}}</p>
            <p><strong>Numéro de commande:</strong> {{orderNumber}}</p>
            <p><strong>Date:</strong> {{orderDate}}</p>
          </div>
        </div>
      `);
    } else if (templateName === 'admin-notification') {
      return handlebars.compile(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🚨 Nouvelle commande - IPTV Smarter Pros</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
            <p><strong>Email client:</strong> {{clientEmail}}</p>
            <p><strong>Produit:</strong> {{productName}}</p>
            <p><strong>Prix:</strong> {{productPrice}}</p>
            <p><strong>Numéro:</strong> {{orderNumber}}</p>
            <p><strong>Date:</strong> {{orderDate}} à {{orderTime}}</p>
            <p><strong>Méthode de paiement:</strong> {{paymentMethod}}</p>
          </div>
        </div>
      `);
    }
  }
}

exports.handler = async function(event, context) {
  console.log('=== FONCTION COMMANDE AVEC TEMPLATES ===');
  console.log('Méthode HTTP:', event.httpMethod);
  
  if (event.httpMethod !== 'POST') {
    console.log('❌ Méthode non autorisée:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    console.log('📥 Parsing du body...');
    const { email, product, orderNumber, paymentDetails } = JSON.parse(event.body);
    console.log('✅ Données reçues:', { email, product, orderNumber });

    // Validation des entrées
    if (!email || !product) {
      console.log('❌ Champs manquants');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email et produit requis' }),
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

    // Récupérer les détails du produit
    const productInfo = PRODUCTS[product] || { 
      name: product, 
      description: 'Abonnement IPTV', 
      price: 'N/A' 
    };
    const finalOrderNumber = orderNumber || generateOrderNumber();
    
    console.log('📦 Produit:', productInfo.name);
    console.log('🔢 Numéro de commande:', finalOrderNumber);

    // Vérification des variables SMTP
    console.log('🔧 Variables SMTP:');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_USER:', process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 5) + '***' : 'MANQUANT');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'CONFIGURÉ' : 'MANQUANT');

    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('❌ Variables SMTP manquantes');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Configuration SMTP manquante' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    console.log('📧 Création du transporteur SMTP...');
    // CORRECTION: createTransporter -> createTransport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true, // Pour port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // 1. Email de confirmation au client
    console.log('📧 Envoi confirmation client à:', email);
    console.log('📝 Chargement template order-confirmation...');
    const confirmationTemplate = getTemplate('order-confirmation');
    
    const confirmationData = {
      productName: productInfo.name,
      productDescription: productInfo.description,
      productPrice: productInfo.price,
      orderNumber: finalOrderNumber,
      orderDate: new Date().toLocaleString('fr-FR')
    };

    const confirmationHtml = confirmationTemplate(confirmationData);

    await transporter.sendMail({
      from: `"IPTV Smarter Pro" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Confirmation de votre commande IPTV Smarter Pros',
      html: confirmationHtml
    });

    console.log('✅ Email confirmation client envoyé');

    // 2. Email de notification à l'admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.MERCHANT_EMAIL || 'contact@iptvsmarterpros.com';
    console.log('📧 Envoi notification admin à:', adminEmail);
    console.log('📝 Chargement template admin-notification...');
    const adminTemplate = getTemplate('admin-notification');

    const adminData = {
      email: email,
      productName: productInfo.name,
      orderNumber: finalOrderNumber,
      productDescription: productInfo.description,
      productPrice: productInfo.price,
      date: new Date().toLocaleString('fr-FR'),
      orderDate: new Date().toLocaleDateString('fr-FR'),
      orderTime: new Date().toLocaleTimeString('fr-FR'),
      clientEmail: email,
      clientPhone: paymentDetails?.phone || 'Non fourni',
      clientIP: event.headers['x-forwarded-for'] || 'Inconnu',
      clientCountry: paymentDetails?.country || 'Inconnu',
      clientDevice: event.headers['user-agent'] || 'Inconnu',
      paymentMethod: paymentDetails?.method || 'PayPal'
    };

    const adminHtml = adminTemplate(adminData);

    await transporter.sendMail({
      from: `"IPTV Smarter Pro" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `🚨 Nouvelle commande #${finalOrderNumber} - ${productInfo.name}`,
      html: adminHtml
    });

    console.log('✅ Email notification admin envoyé');
    console.log('🎉 Commande traitée avec succès');

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Commande confirmée avec succès',
        orderNumber: finalOrderNumber
      }),
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (error) {
    console.error('❌ ERREUR lors du traitement de la commande:', error);
    console.error('📍 Stack:', error.stack);
    
    // Diagnostics spécifiques
    if (error.message.includes('EAUTH')) {
      console.error('🔧 Problème d\'authentification SMTP - Vérifiez SMTP_USER et SMTP_PASS');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('🔧 Problème de connexion SMTP - Vérifiez SMTP_HOST et SMTP_PORT');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('🔧 Problème DNS - Vérifiez SMTP_HOST');
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erreur lors du traitement de la commande',
        details: error.message
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}; 