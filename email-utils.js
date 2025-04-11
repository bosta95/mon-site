const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Cache pour stocker les templates compilés
const templateCache = {};

/**
 * Charge et compile un template d'email
 * @param {string} templateName - Nom du fichier template (sans l'extension)
 * @returns {Function} Template compilé Handlebars
 */
function getEmailTemplate(templateName) {
  // Si le template est déjà dans le cache, le retourner
  if (templateCache[templateName]) {
    return templateCache[templateName];
  }

  // Construire le chemin du fichier
  const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
  
  try {
    // Lire le fichier template
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    
    // Compiler le template avec Handlebars
    const compiledTemplate = handlebars.compile(templateSource);
    
    // Mettre en cache le template compilé
    templateCache[templateName] = compiledTemplate;
    
    return compiledTemplate;
  } catch (error) {
    console.error(`Erreur lors du chargement du template ${templateName}:`, error);
    throw error;
  }
}

/**
 * Crée un transporteur Nodemailer avec les paramètres SMTP
 * @returns {Object} Transporteur Nodemailer
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Envoie un email en utilisant un template
 * @param {Object} options - Options d'envoi
 * @param {string} options.to - Adresse email du destinataire
 * @param {string} options.subject - Sujet de l'email
 * @param {string} options.templateName - Nom du template à utiliser
 * @param {Object} options.data - Données à injecter dans le template
 * @returns {Promise} Promesse résolue avec l'info d'envoi
 */
async function sendTemplateEmail({ to, subject, templateName, data = {} }) {
  try {
    // Obtenir le template
    const template = getEmailTemplate(templateName);
    
    // Rendre le HTML avec les données
    const html = template(data);
    
    // Créer le transporteur
    const transporter = createTransporter();
    
    // Envoyer l'email
    const info = await transporter.sendMail({
      from: `"IPTV Smarter Pros" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });
    
    console.log(`Email ${templateName} envoyé à ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Erreur lors de l'envoi de l'email ${templateName}:`, error);
    throw error;
  }
}

module.exports = {
  getEmailTemplate,
  createTransporter,
  sendTemplateEmail
}; 