const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email, product, orderNumber } = JSON.parse(event.body);

    // Configuration du transporteur email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Email au client
    await transporter.sendMail({
      from: process.env.SMTP_USER,
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

    // Email à l'administrateur
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.MERCHANT_EMAIL,
      subject: 'Nouvelle commande IPTV Smarter Pros',
      html: `
        <h1>Nouvelle commande reçue</h1>
        <p><strong>Client :</strong> ${email}</p>
        <p><strong>Produit :</strong> ${product}</p>
        <p><strong>Numéro de commande :</strong> ${orderNumber}</p>
      `
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Emails envoyés avec succès' })
    };
  } catch (error) {
    console.error('Erreur:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erreur lors de l\'envoi des emails' })
    };
  }
}; 