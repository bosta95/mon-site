// Version de test ultra-simple sans dépendances

exports.handler = async function(event, context) {
  console.log('=== TEST FONCTION CONTACT ===');
  console.log('Méthode:', event.httpMethod);
  console.log('Event body:', event.body);
  
  // Test basique sans dépendances
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    // Test simple de parsing
    console.log('Tentative de parsing du body...');
    const data = JSON.parse(event.body);
    console.log('Data parsée:', data);
    
    // Test simple de validation
    if (!data.name || !data.email) {
      console.log('Champs manquants détectés');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Nom et email requis' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
    
    // Test des variables d'environnement
    console.log('Test variables env...');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    
    // Pour l'instant, juste retourner succès sans envoyer d'email
    console.log('Retour de succès de test');
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Test réussi - Données reçues',
        received: {
          name: data.name,
          email: data.email,
          subject: data.subject
        }
      }),
      headers: { 'Content-Type': 'application/json' }
    };
    
  } catch (error) {
    console.error('ERREUR dans la fonction:', error);
    console.error('Stack:', error.stack);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erreur interne',
        details: error.message,
        stack: error.stack
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}; 