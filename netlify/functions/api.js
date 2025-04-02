const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email, product, orderNumber } = JSON.parse(event.body);
    console.log('Données reçues:', { email, product, orderNumber });

    // Configuration du transporteur email avec Namecheap PrivateEmail
    const transporter = nodemailer.createTransport({
      host: 'mail.privateemail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'contact@iptvsmarterpros.com',
        pass: process.env.SMTP_PASS
      },
      debug: true
    });

    console.log('Configuration SMTP:', {
      host: 'mail.privateemail.com',
      port: 465,
      user: 'contact@iptvsmarterpros.com',
      merchantEmail: 'contact@iptvsmarterpros.com'
    });

    // Email au client
    const clientEmailResult = await transporter.sendMail({
      from: 'IPTV Smarter Pros <contact@iptvsmarterpros.com>',
      to: email,
      subject: 'Confirmation de commande IPTV Smarter Pros',
      html: `
        <h1>Merci pour votre commande !</h1>
        <p>Votre commande a bien été reçue.</p>
        <p><strong>Produit :</strong> ${product}</p>
        <p><strong>Numéro de commande :</strong> ${orderNumber}</p>
        <p>Nous vous enverrons vos identifiants de connexion dans un prochain email.</p>
      `
    });
    console.log('Email client envoyé:', clientEmailResult.messageId);

    // Email à l'administrateur
    const adminEmailResult = await transporter.sendMail({
      from: 'IPTV Smarter Pros <contact@iptvsmarterpros.com>',
      to: 'contact@iptvsmarterpros.com',
      subject: 'Nouvelle commande IPTV Smarter Pros',
      html: `
        <h1>Nouvelle commande reçue</h1>
        <p><strong>Client :</strong> ${email}</p>
        <p><strong>Produit :</strong> ${product}</p>
        <p><strong>Numéro de commande :</strong> ${orderNumber}</p>
        <p>Veuillez envoyer les identifiants de connexion au client.</p>
      `
    });
    console.log('Email admin envoyé:', adminEmailResult.messageId);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Emails envoyés avec succès' })
    };
  } catch (error) {
    console.error('Erreur détaillée:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erreur lors de l\'envoi des emails', details: error.message })
    };
  }
}; 