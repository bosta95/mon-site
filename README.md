# IPTV Smarter Pros

Site web pour le service IPTV Smarter Pros.

## Configuration

1. Créez un fichier `.env` à la racine du projet avec les variables suivantes :
```
PORT=3000
SMTP_HOST=mail.privateemail.com
SMTP_PORT=465
SMTP_USER=contact@iptvsmarterpros.com
MERCHANT_EMAIL=contact@iptvsmarterpros.com
SMTP_PASS=votre_mot_de_passe
PAYPAL_CLIENT_ID=votre_client_id
PAYPAL_SECRET=votre_secret
```

2. Installez les dépendances :
```bash
npm install
```

3. Démarrez le serveur :
```bash
node server.js
```

## Déploiement

1. Créez un nouveau repository sur GitHub
2. Initialisez Git dans votre projet :
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin votre_url_github
git push -u origin master
```

3. Allez dans les paramètres de votre repository GitHub
4. Dans la section "Pages", sélectionnez la branche "master" comme source
5. Votre site sera accessible à l'adresse : `https://votre_username.github.io/nom_du_repo`

## Configuration du domaine personnalisé

1. Dans les paramètres de votre repository GitHub, ajoutez votre domaine personnalisé
2. Configurez les enregistrements DNS de votre domaine :
   - Type A : `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Type CNAME : `www` pointe vers `votre_username.github.io` 