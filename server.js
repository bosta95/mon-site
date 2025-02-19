const express = require('express');
const path = require('path');
const app = express();

// Servir les fichiers statiques depuis le dossier courant
app.use(express.static(__dirname));

// Retourner index.html pour la route racine
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Démarrer le serveur sur le port fourni par Heroku ou 3000 en local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
