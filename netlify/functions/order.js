const emailUtils = require('../../email-utils');

// Configuration des produits - CODES RÉELS DU SITE
const PRODUCTS = {
  // Codes trouvés sur votre site
  'Premium_IPTV_12_mois': {
    name: 'Abonnement IPTV Premium 12 Mois',
    description: 'Accès complet pendant 12 mois - Plus de 22 000 chaînes et 50 000 VOD',
    price: '29.99€'
  },
  'Premium_IPTV_12_mois_3_ecrans': {
    name: 'Abonnement IPTV Premium 12 Mois - 3 Écrans',
    description: 'Accès complet pendant 12 mois pour 3 écrans - Plus de 22 000 chaînes et 50 000 VOD',
    price: '79.99€'
  },
  'Premium_IPTV_6_mois_4_ecrans': {
    name: 'Abonnement IPTV Premium 6 Mois - 4 Écrans',
    description: 'Accès complet pendant 6 mois pour 4 écrans - Plus de 22 000 chaînes et 50 000 VOD',
    price: '79.99€'
  },
  'Premium_IPTV_3_mois_3_ecrans': {
    name: 'Abonnement IPTV Premium 3 Mois - 3 Écrans',
    description: 'Accès complet pendant 3 mois pour 3 écrans - Plus de 22 000 chaînes et 50 000 VOD',
    price: '29.99€'
  },
  // Codes compatibilité pour PayPal (si nécessaire)
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

exports.handler = async function(event, context) {
  console.log('=== DÉBUT TRAITEMENT COMMANDE ===');
  console.log('Méthode HTTP:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers, null, 2));
  
  if (event.httpMethod !== 'POST') {
    console.log('❌ Méthode non autorisée:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  }

  try {
    const { email, product, orderNumber, paymentDetails } = JSON.parse(event.body);
    console.log('Données reçues:', { email, product, orderNumber, paymentDetails });

    // Validation des entrées
    if (!email || !product) {
      console.log('❌ Champs manquants');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email et produit requis' }),
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }

    if (!isValidEmail(email)) {
      console.log('❌ Email invalide:', email);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Format d\'email invalide' }),
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    }

    // Récupérer les détails du produit
    const productInfo = PRODUCTS[product] || { 
      name: product, 
      description: 'Abonnement IPTV', 
      price: 'N/A' 
    };
    const finalOrderNumber = orderNumber || generateOrderNumber();
    
    console.log('📦 Produit:', productInfo);
    console.log('🔢 Numéro de commande:', finalOrderNumber);

    console.log('🔧 Configuration SMTP:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 5) + '***' : 'NON CONFIGURÉ'
    });

    // Email de confirmation au client
    console.log('📧 Envoi confirmation client à:', email);
    await emailUtils.sendTemplateEmail({
      to: email,
      subject: 'Confirmation de votre commande IPTV Smarter Pros',
      templateName: 'order-confirmation',
      data: {
        productName: productInfo.name,
        productDescription: productInfo.description,
        productPrice: productInfo.price,
        orderNumber: finalOrderNumber
      }
    });

    // Email de notification à l'administrateur
    const adminEmail = process.env.ADMIN_EMAIL || process.env.MERCHANT_EMAIL || 'contact@iptvsmarterpros.com';
    console.log('📧 Envoi notification admin à:', adminEmail);
    await emailUtils.sendTemplateEmail({
      to: adminEmail,
      subject: `🚨 Nouvelle commande #${finalOrderNumber} - ${productInfo.name}`,
      templateName: 'admin-notification',
      data: {
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
      }
    });

    console.log('✅ Commande traitée avec succès');

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Commande confirmée avec succès',
        orderNumber: finalOrderNumber
      }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };

  } catch (error) {
    console.error('❌ ERREUR lors du traitement de la commande:', error);
    console.error('Stack trace:', error.stack);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erreur lors du traitement de la commande',
        details: error.message
      }),
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
}; 