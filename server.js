// server.js
require('dotenv').config(); // Charge les variables d'environnement depuis le fichier .env

const express = require('express');
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Sert les fichiers statiques dans le dossier public
app.use(express.static('public'));

// Pour traiter le JSON standard dans les autres routes
app.use(express.json());

// Endpoint pour fournir la clé publique côté client (optionnel)
app.get('/config', (req, res) => {
  res.json({ publicKey: process.env.STRIPE_PUBLIC_KEY });
});

// Endpoint pour créer une session de paiement Stripe Checkout
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { product, price } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: product || 'Test Product',
          },
          unit_amount: Math.round(parseFloat(price || 9.99) * 100), // Montant en centimes
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'http://localhost:3000/success.html',
      cancel_url: 'http://localhost:3000/cancel.html',
    });
    res.json({ id: session.id });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.toString());
  }
});

// Endpoint pour gérer les webhooks Stripe (suivi des paiements)
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Ajoute cette variable dans ton fichier .env
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gère les événements souhaités
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Paiement réussi pour la session:', session.id);
      // Ici, ajoute ton code pour mettre à jour ta base de données ou notifier un administrateur
      break;
    // Tu peux ajouter d'autres cas selon tes besoins
    default:
      console.log(`Événement non géré: ${event.type}`);
  }

  res.json({ received: true });
});

// Utilise le port défini par Heroku ou 3000 en local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
