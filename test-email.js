const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Fonction pour envoyer l'email de confirmation
async function sendOrderConfirmation() {
  const orderData = {
    email: process.env.SMTP_USER,
    product: "IPTV Premium 12 mois",
    orderNumber: "CMD123456"
  };

  try {
    // Email pour le client
    const clientEmail = await transporter.sendMail({
      from: `"IPTV Smarter Pros" <${process.env.SMTP_USER}>`,
      to: orderData.email,
      subject: `Confirmation de commande N° ${orderData.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50; text-align: center;">Confirmation de votre commande</h2>
          
          <p>Bonjour,</p>
          
          <p>Nous vous remercions pour votre confiance ! Votre commande a bien été enregistrée.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Détails de votre commande</h3>
            <p><strong>Numéro de commande :</strong> ${orderData.orderNumber}</p>
            <p><strong>Produit :</strong> ${orderData.product}</p>
          </div>
          
          <p>Pour toute question concernant votre commande, n'hésitez pas à nous contacter à <a href="mailto:contact@iptvsmarterpros.com">contact@iptvsmarterpros.com</a></p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      `
    });

    // Email pour l'admin
    const adminEmail = await transporter.sendMail({
      from: `"IPTV Smarter Pros" <${process.env.SMTP_USER}>`,
      to: process.env.MERCHANT_EMAIL,
      subject: `[Nouvelle Commande] N° ${orderData.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50;">Nouvelle commande reçue</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Détails de la commande</h3>
            <p><strong>Numéro de commande :</strong> ${orderData.orderNumber}</p>
            <p><strong>Produit :</strong> ${orderData.product}</p>
            <p><strong>Email du client :</strong> ${orderData.email}</p>
          </div>
          
          <p>Cette commande nécessite votre attention pour le traitement.</p>
        </div>
      `
    });

    console.log('✅ Emails envoyés avec succès !');
    console.log('📧 ID du message client:', clientEmail.messageId);
    console.log('📧 ID du message admin:', adminEmail.messageId);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:', error.message);
  }
}

// Envoyer les emails de confirmation
sendOrderConfirmation(); 