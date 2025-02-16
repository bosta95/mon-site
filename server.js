// server.js
require('dotenv').config(); // Charge les variables d'environnement depuis le fichier .env

const express = require('express');
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(express.static('public'));
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

app.listen(3000, () => console.log('Serveur démarré sur http://localhost:3000'));
