const express = require('express');
const app = express();

// Page de test simple
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test IPTV Smarter Pros</title>
      <style>
        body { font-family: Arial; padding: 20px; }
        form { max-width: 400px; margin: 20px auto; }
        input { width: 100%; padding: 8px; margin: 5px 0; }
        button { padding: 10px; background: #4CAF50; color: white; border: none; }
      </style>
    </head>
    <body>
      <h1>Test d'envoi d'email</h1>
      <form id="testForm">
        <input type="email" id="email" placeholder="Votre email" required>
        <input type="text" id="product" placeholder="Nom du produit" required>
        <input type="text" id="orderNumber" placeholder="Numéro de commande" required>
        <button type="submit">Envoyer</button>
      </form>
      <div id="result"></div>
      <script>
        document.getElementById('testForm').onsubmit = async (e) => {
          e.preventDefault();
          const data = {
            email: document.getElementById('email').value,
            product: document.getElementById('product').value,
            orderNumber: document.getElementById('orderNumber').value
          };
          try {
            const response = await fetch('/api/order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            const result = await response.json();
            document.getElementById('result').textContent = 
              response.ok ? 'Email envoyé !' : 'Erreur: ' + result.error;
          } catch (error) {
            document.getElementById('result').textContent = 'Erreur: ' + error.message;
          }
        };
      </script>
    </body>
    </html>
  `);
});

// Route API pour l'envoi d'email
app.post('/api/order', async (req, res) => {
  console.log('Tentative d\'envoi d\'email:', req.body);
  try {
    const { email, product, orderNumber } = req.body;
    console.log('Email:', email);
    console.log('Produit:', product);
    console.log('Numéro:', orderNumber);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: error.message });
  }
});

// Démarrage du serveur
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Serveur de test démarré sur http://localhost:${PORT}`);
  console.log(`🌐 Essayez aussi http://127.0.0.1:${PORT}\n`);
}); 