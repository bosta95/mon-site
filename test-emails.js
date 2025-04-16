const axios = require('axios');
require('dotenv').config();

// Configuration
const API_BASE_URL = 'http://localhost:3000'; // Modifier si nécessaire
const TEST_EMAIL = 'contact@iptvsmarterpros.com'; // Utilisez votre propre email pour tester

// Fonction de test pour le formulaire de contact
async function testContactForm() {
  console.log('\n=== TEST DU FORMULAIRE DE CONTACT ===');
  try {
    const response = await axios.post(`${API_BASE_URL}/api/contact`, {
      name: 'Test Utilisateur',
      email: TEST_EMAIL,
      subject: 'Test du formulaire de contact',
      message: 'Ceci est un message de test pour vérifier que les emails du formulaire de contact fonctionnent correctement.'
    });
    
    console.log('✅ Formulaire de contact - Réponse du serveur:', response.data);
    console.log('📧 Vérifiez votre boîte de réception admin pour l\'email de contact.');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du test du formulaire de contact:');
    if (error.response) {
      // La requête a été faite et le serveur a répondu avec un code d'état différent de 2xx
      console.error(`  Code d'erreur: ${error.response.status}`);
      console.error('  Réponse du serveur:', error.response.data);
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      console.error('  Pas de réponse du serveur. Vérifiez que le serveur est en cours d\'exécution.');
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      console.error('  Erreur:', error.message);
    }
    return false;
  }
}

// Fonction de test pour la confirmation de commande
async function testOrderConfirmation() {
  console.log('\n=== TEST DE LA CONFIRMATION DE COMMANDE ===');
  
  // Générer un numéro de commande unique
  const orderNumber = `TEST-${Date.now()}`;
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/order`, {
      email: TEST_EMAIL, // Utilisez le même email pour tester
      product: '1_mois', // Utilise un produit valide défini dans isValidProduct
      orderNumber: orderNumber
    });
    
    console.log('✅ Confirmation de commande - Réponse du serveur:', response.data);
    console.log('📧 Vérifiez:');
    console.log('   1. Votre boîte de réception admin pour l\'email de nouvelle commande');
    console.log('   2. La boîte de réception client pour la confirmation de commande');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du test de la confirmation de commande:');
    if (error.response) {
      console.error(`  Code d'erreur: ${error.response.status}`);
      console.error('  Réponse du serveur:', error.response.data);
    } else if (error.request) {
      console.error('  Pas de réponse du serveur. Vérifiez que le serveur est en cours d\'exécution.');
    } else {
      console.error('  Erreur:', error.message);
    }
    return false;
  }
}

// Fonction principale qui exécute tous les tests
async function runAllTests() {
  console.log('=== DÉMARRAGE DES TESTS D\'EMAILS ===');
  console.log(`Date et heure du test: ${new Date().toLocaleString()}`);
  console.log('Server URL:', API_BASE_URL);
  
  let contactResult, orderResult;
  
  try {
    contactResult = await testContactForm();
    // Attendre un peu entre les tests pour éviter de surcharger le serveur SMTP
    await new Promise(resolve => setTimeout(resolve, 2000));
    orderResult = await testOrderConfirmation();
    
    console.log('\n=== RÉSUMÉ DES TESTS ===');
    console.log(`Test du formulaire de contact: ${contactResult ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'}`);
    console.log(`Test de la confirmation de commande: ${orderResult ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'}`);
    
    if (contactResult && orderResult) {
      console.log('\n✅✅✅ TOUS LES TESTS ONT RÉUSSI');
    } else {
      console.log('\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ');
      console.log('Vérifiez les logs ci-dessus pour plus de détails.');
    }
  } catch (error) {
    console.error('\n❌ ERREUR INATTENDUE PENDANT LES TESTS:', error);
  }
}

// Exécuter tous les tests
runAllTests(); 