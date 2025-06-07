const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  console.log('=== TEST PORT 587 NAMECHEAP ===');
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    console.log('📧 Test spécifique port 587 + STARTTLS...');
    
    // Configuration spéciale port 587 (souvent moins bloqué)
    const transporter = nodemailer.createTransporter({
      host: 'mail.privateemail.com',
      port: 587, // Port 587 au lieu de 465
      secure: false, // false pour port 587
      requireTLS: true, // Force STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    });

    console.log('🔍 Test connexion port 587...');
    await transporter.verify();
    console.log('✅ Port 587 fonctionne !');

    // Test envoi
    const result = await transporter.sendMail({
      from: `"IPTV Smarter Pro" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: 'Test port 587 depuis Netlify',
      text: 'Si tu reçois ceci, le port 587 passe les restrictions Netlify !',
      html: `
        <h2>🎉 Port 587 réussi !</h2>
        <p>Ta messagerie Namecheap (40€/an) fonctionne avec Netlify via le port 587 !</p>
        <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
      `
    });

    console.log('✅ EMAIL ENVOYÉ via port 587 !');

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: '🎉 SUCCÈS ! Port 587 contourne les restrictions Netlify !',
        messageId: result.messageId,
        solution: 'Utiliser port 587 au lieu de 465'
      }),
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (error) {
    console.error('❌ Port 587 échoue aussi:', error.message);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Port 587 bloqué aussi - Netlify bloque vraiment SMTP',
        solution: 'Utiliser Zapier webhook vers ta messagerie Namecheap',
        webhook_info: {
          principe: 'Formulaire → Zapier → Email via Namecheap',
          cout: 'Gratuit (100 emails/mois)',
          resultat: 'Tu reçois dans contact@iptvsmarterpros.com'
        }
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}; 