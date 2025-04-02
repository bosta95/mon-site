const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  console.log('Début de la fonction contact');
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email, subject, message } = JSON.parse(event.body);
    console.log('Données reçues:', { email, subject, message });

    // Configuration du transporteur email
    const smtpConfig = {
      host: 'smtp.privateemail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'contact@iptvsmarterpros.com',
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true,
      logger: true
    };

    console.log('Configuration SMTP:', {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      user: smtpConfig.auth.user
    });

    const transporter = nodemailer.createTransport(smtpConfig);

    console.log('Vérification de la connexion SMTP...');
    try {
      await transporter.verify();
      console.log('✓ Connexion SMTP vérifiée avec succès');
    } catch (verifyError) {
      console.error('Erreur de vérification SMTP:', verifyError);
      throw new Error(`Échec de la vérification SMTP: ${verifyError.message}`);
    }

    console.log('Envoi de l\'email à l\'administrateur...');
    const adminEmail = await transporter.sendMail({
      from: `"IPTV Contact" <contact@iptvsmarterpros.com>`,
      to: 'contact@iptvsmarterpros.com',
      subject: `Nouveau message de contact - ${subject}`,
      html: `
        <h1>Nouveau message de contact</h1>
        <p><strong>De :</strong> ${email}</p>
        <p><strong>Sujet :</strong> ${subject}</p>
        <p><strong>Message :</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    });
    console.log('✓ Email admin envoyé:', adminEmail.messageId);

    console.log('Envoi de l\'email de confirmation au client...');
    const clientEmail = await transporter.sendMail({
      from: `"IPTV Smarter Pros" <contact@iptvsmarterpros.com>`,
      to: email,
      subject: 'Confirmation de réception de votre message - IPTV Smarter Pros',
      html: `
        <h1>Nous avons bien reçu votre message</h1>
        <p>Cher client,</p>
        <p>Nous confirmons la réception de votre message concernant "${subject}".</p>
        <p>Notre équipe vous répondra dans les plus brefs délais.</p>
        <p>Cordialement,<br>L'équipe IPTV Smarter Pros</p>
      `
    });
    console.log('✓ Email client envoyé:', clientEmail.messageId);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Emails envoyés avec succès',
        adminEmailId: adminEmail.messageId,
        clientEmailId: clientEmail.messageId
      })
    };
  } catch (error) {
    console.error('Erreur détaillée:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erreur lors de l\'envoi des emails',
        message: error.message,
        stack: error.stack,
        config: {
          host: 'smtp.privateemail.com',
          port: 465,
          secure: true
        }
      })
    };
  }
}; 