const express = require('express');
const path = require('path');
const app = express();

// Sert tous les fichiers statiques du dossier "public"
app.use(express.static(path.join(__dirname, 'public')));

// Redirige la racine vers index.html dans "public"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarre le serveur sur le port fourni par Heroku ou 3000 en local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
