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
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    const { email, product, orderNumber, paymentDetails } = JSON.parse(event.body);

    // Validation des entrées
    if (!email || !product) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email et produit requis' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    if (!isValidEmail(email)) {
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

    // Email de confirmation au client
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
    await emailUtils.sendTemplateEmail({
      to: process.env.ADMIN_EMAIL || process.env.MERCHANT_EMAIL || 'contact@iptvsmarterpros.com',
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

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Commande confirmée avec succès',
        orderNumber: finalOrderNumber
      }),
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (error) {
    console.error('Erreur lors du traitement de la commande:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erreur lors du traitement de la commande' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}; 