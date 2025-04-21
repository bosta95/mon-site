const axios = require('axios');
require('dotenv').config();

// Configuration
const API_BASE_URL = 'http://localhost:3000'; // URL de l'API locale
const TEST_EMAIL = 'contact@iptvsmarterpros.com'; // Adresse pour les tests

// Fonction de test pour le formulaire de contact
async function testContactForm() {
  console.log('\n=== TEST DU FORMULAIRE DE CONTACT ===');
  try {
    const response = await axios.post(`${API_BASE_URL}/api/contact`, {
      name: 'Test Utilisateur',
      email: TEST_EMAIL,
      subject: 'Test du formulaire de contact',
      message: 'Ceci est un message de test pour vérifier le fonctionnement du formulaire de contact.'
    });
    
    console.log('✅ Formulaire de contact - Réponse du serveur:', response.data);
    console.log('📧 Un email doit être reçu à l\'adresse admin et une confirmation à l\'adresse client.');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du test du formulaire de contact:');
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

// Fonction de test pour la confirmation de commande
async function testOrderConfirmation() {
  console.log('\n=== TEST DE LA CONFIRMATION DE COMMANDE ===');
  
  // Générer un numéro de commande unique
  const orderNumber = `TEST-${Date.now()}`;
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/order`, {
      email: TEST_EMAIL,
      product: 'Premium_IPTV_3_mois', // Produit valide selon la nouvelle liste
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
  console.log(`Date et heure du test: ${new Date().toLocaleString('fr-FR')}`);
  console.log('Server URL:', API_BASE_URL);
  
  let contactResult, orderResult;
  
  try {
    contactResult = await testContactForm();
    // Attendre entre les tests pour éviter de surcharger le serveur SMTP
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