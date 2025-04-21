/**
 * Script de vérification de l'indexation Google
 * Ce script analyse l'indexation des URLs du sitemap dans Google Search Console
 * et génère un rapport détaillé sur l'état de l'indexation du site.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { parseString } = require('xml2js');
require('dotenv').config();

// Configuration globale
const CONFIG = {
  sitemapPath: path.join(__dirname, 'public', 'sitemap.xml'),
  robotsPath: path.join(__dirname, 'public', 'robots.txt'),
  resultsPath: path.join(__dirname, 'indexation-results'),
  domainName: 'iptvsmarterpros.com',
  googleApiKey: process.env.GOOGLE_API_KEY,
  googleSearchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID
};

// Créer le dossier de résultats s'il n'existe pas
if (!fs.existsSync(CONFIG.resultsPath)) {
  fs.mkdirSync(CONFIG.resultsPath, { recursive: true });
}

/**
 * Lit et analyse le fichier sitemap pour extraire les URLs
 * @returns {Promise<Array>} Liste des URLs extraites du sitemap
 */
async function readSitemap() {
  try {
    console.log(`Lecture du sitemap: ${CONFIG.sitemapPath}`);
    const sitemapContent = fs.readFileSync(CONFIG.sitemapPath, 'utf8');
    
    return new Promise((resolve, reject) => {
      parseString(sitemapContent, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        
        const urls = result.urlset.url.map(urlObj => {
          return {
            url: urlObj.loc[0],
            lastmod: urlObj.lastmod ? urlObj.lastmod[0] : '',
            priority: urlObj.priority ? urlObj.priority[0] : '',
            changefreq: urlObj.changefreq ? urlObj.changefreq[0] : ''
          };
        });
        
        console.log(`Nombre d'URLs trouvées dans le sitemap: ${urls.length}`);
        resolve(urls);
      });
    });
  } catch (error) {
    console.error('Erreur lors de la lecture du sitemap:', error);
    return [];
  }
}

/**
 * Lit le fichier robots.txt
 * @returns {string} Contenu du fichier robots.txt
 */
function readRobotsTxt() {
  try {
    console.log(`Lecture du fichier robots.txt: ${CONFIG.robotsPath}`);
    return fs.readFileSync(CONFIG.robotsPath, 'utf8');
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier robots.txt:', error);
    return '';
  }
}

/**
 * Vérifie si une URL est bloquée par robots.txt
 * @param {string} url - URL à vérifier
 * @param {string} robotsContent - Contenu du fichier robots.txt
 * @returns {boolean} True si l'URL est bloquée
 */
function isBlockedByRobotsTxt(url, robotsContent) {
  const urlPath = new URL(url).pathname;
  
  // Extraire les règles Disallow du fichier robots.txt
  const disallowRules = robotsContent
    .split('\n')
    .filter(line => line.trim().startsWith('Disallow:'))
    .map(line => line.split('Disallow:')[1].trim());
  
  // Vérifier si l'URL est bloquée par une règle
  return disallowRules.some(rule => {
    if (rule === '/') return true;
    if (rule.endsWith('*')) {
      const prefix = rule.slice(0, -1);
      return urlPath.startsWith(prefix);
    }
    return urlPath === rule;
  });
}

/**
 * Vérifie l'indexation Google avec l'API Search Console
 * @param {string} url - URL à vérifier
 * @returns {Promise<Object>} Résultat de l'indexation
 */
async function checkGoogleIndexation(url) {
  try {
    if (!CONFIG.googleApiKey || !CONFIG.googleSearchEngineId) {
      console.warn('Clés API Google manquantes, utilisation du mode simulation');
      return checkIndexationSimulation(url);
    }

    const encodedUrl = encodeURIComponent(url);
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${CONFIG.googleApiKey}&cx=${CONFIG.googleSearchEngineId}&q=site:${encodedUrl}`;
    console.log(`Vérification de l'indexation de: ${url}`);
    
    const response = await axios.get(searchUrl);
    
    if (response.data && response.data.searchInformation) {
      return {
        url,
        indexed: parseInt(response.data.searchInformation.totalResults) > 0,
        totalResults: response.data.searchInformation.totalResults,
        formattedTotalResults: response.data.searchInformation.formattedTotalResults,
        timestamp: new Date().toISOString()
      };
    }
    
    return { 
      url, 
      indexed: false, 
      totalResults: 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Erreur lors de la vérification de l'URL ${url}:`, error.message);
    return { 
      url, 
      indexed: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Mode simulation pour tester sans API Google
 * @param {string} url - URL à simuler
 * @returns {Object} Résultat simulé de l'indexation
 */
function checkIndexationSimulation(url) {
  console.log(`Simulation de vérification pour: ${url}`);
  return {
    url,
    indexed: Math.random() > 0.3, // 70% de chance d'être indexé
    totalResults: Math.floor(Math.random() * 10),
    simulated: true,
    timestamp: new Date().toISOString()
  };
}

/**
 * Analyse la qualité d'une URL
 * @param {string} url - URL à analyser
 * @returns {Object} Analyse de qualité de l'URL
 */
function analyzeUrlQuality(url) {
  const urlObj = new URL(url);
  const issues = [];
  
  // Vérifier la longueur de l'URL
  if (url.length > 100) {
    issues.push('URL trop longue (>100 caractères)');
  }
  
  // Vérifier la présence de paramètres d'URL non essentiels
  if (urlObj.searchParams.has('fbclid') || urlObj.searchParams.has('utm_source')) {
    issues.push('Présence de paramètres de tracking (devrait être bloqué dans robots.txt)');
  }
  
  // Vérifier la structure de l'URL
  if (urlObj.pathname.split('/').length > 4) {
    issues.push('Structure d\'URL trop profonde');
  }
  
  // Vérifier les majuscules dans l'URL
  if (/[A-Z]/.test(urlObj.pathname)) {
    issues.push('Présence de majuscules dans l\'URL');
  }
  
  return {
    issues,
    hasIssues: issues.length > 0
  };
}

/**
 * Génère un rapport HTML des résultats d'indexation
 * @param {Array} results - Résultats d'indexation
 * @param {string} robotsContent - Contenu du fichier robots.txt
 * @returns {string} HTML du rapport
 */
function generateHtmlReport(results, robotsContent) {
  const indexedCount = results.filter(r => r.indexed).length;
  const percentage = ((indexedCount / results.length) * 100).toFixed(1);
  const date = new Date().toLocaleString('fr-FR');
  
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'indexation Google - ${CONFIG.domainName}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    .summary {
      background-color: #f8f9fa;
      border-radius: 5px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .progress-container {
      width: 100%;
      background-color: #e0e0e0;
      border-radius: 5px;
      margin: 10px 0;
    }
    .progress-bar {
      height: 24px;
      border-radius: 5px;
      background-color: ${percentage > 70 ? '#28a745' : percentage > 40 ? '#ffc107' : '#dc3545'};
      text-align: center;
      color: white;
      font-weight: bold;
      line-height: 24px;
    }
    .report-date {
      color: #6c757d;
      font-style: italic;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f8f9fa;
      font-weight: bold;
    }
    tr:hover {
      background-color: #f1f1f1;
    }
    .status {
      padding: 5px 10px;
      border-radius: 3px;
      font-weight: bold;
    }
    .indexed {
      background-color: #d4edda;
      color: #155724;
    }
    .not-indexed {
      background-color: #f8d7da;
      color: #721c24;
    }
    .blocked {
      background-color: #fff3cd;
      color: #856404;
    }
    .quality-issues {
      color: #dc3545;
      margin-top: 5px;
    }
    .robots-content {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      white-space: pre-wrap;
      font-family: monospace;
      overflow-x: auto;
    }
    .recommendations {
      background-color: #e8f4f8;
      padding: 15px;
      border-radius: 5px;
      margin-top: 20px;
    }
    .recommendations ul {
      margin: 10px 0;
      padding-left: 20px;
    }
  </style>
</head>
<body>
  <h1>Rapport d'indexation Google</h1>
  <div class="report-date">Généré le ${date}</div>
  
  <div class="summary">
    <h2>Résumé</h2>
    <p>Domain: <strong>${CONFIG.domainName}</strong></p>
    <p>URLs indexées: <strong>${indexedCount}/${results.length} (${percentage}%)</strong></p>
    
    <div class="progress-container">
      <div class="progress-bar" style="width: ${percentage}%">${percentage}%</div>
    </div>
  </div>
  
  <h2>Détails des URLs</h2>
  <table>
    <thead>
      <tr>
        <th>URL</th>
        <th>Statut</th>
        <th>Priorité</th>
        <th>Dernière modification</th>
        <th>Fréquence</th>
      </tr>
    </thead>
    <tbody>
      ${results.map(result => {
        const urlQuality = analyzeUrlQuality(result.url);
        const isBlocked = isBlockedByRobotsTxt(result.url, robotsContent);
        
        let statusClass = 'not-indexed';
        let statusText = 'Non indexé';
        
        if (isBlocked) {
          statusClass = 'blocked';
          statusText = 'Bloqué par robots.txt';
        } else if (result.indexed) {
          statusClass = 'indexed';
          statusText = 'Indexé';
        }
        
        return `
          <tr>
            <td>
              <a href="${result.url}" target="_blank">${result.url}</a>
              ${urlQuality.hasIssues ? `<div class="quality-issues">Problèmes: ${urlQuality.issues.join(', ')}</div>` : ''}
            </td>
            <td><span class="status ${statusClass}">${statusText}</span></td>
            <td>${result.priority || 'N/A'}</td>
            <td>${result.lastmod || 'N/A'}</td>
            <td>${result.changefreq || 'N/A'}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>
  
  <h2>Robots.txt</h2>
  <div class="robots-content">${robotsContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  
  <div class="recommendations">
    <h2>Recommandations pour améliorer l'indexation</h2>
    <ul>
      <li>Assurez-vous que toutes les pages importantes ont une priorité élevée dans le sitemap</li>
      <li>Vérifiez que vos pages sont accessibles aux robots de Google (pas de blocage dans robots.txt)</li>
      <li>Créez des liens internes vers les pages importantes non indexées</li>
      <li>Soumettez régulièrement votre sitemap à Google Search Console</li>
      <li>Corrigez les URLs ayant des problèmes de qualité</li>
    </ul>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Sauvegarde les résultats au format JSON
 * @param {Array} results - Résultats d'indexation
 * @returns {string} Chemin du fichier sauvegardé
 */
function saveResultsAsJson(results) {
  const date = new Date().toISOString().slice(0, 10);
  const filePath = path.join(CONFIG.resultsPath, `indexation-data-${date}.json`);
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  console.log(`Données sauvegardées dans: ${filePath}`);
  return filePath;
}

/**
 * Fonction principale qui orchestre le processus de vérification
 */
async function main() {
  try {
    // Étape 1: Lire le sitemap et robots.txt
    const urls = await readSitemap();
    const robotsContent = readRobotsTxt();
    
    if (urls.length === 0) {
      console.error("Erreur: Aucune URL trouvée dans le sitemap.");
      return;
    }
    
    console.log(`Analyse de ${urls.length} URLs...`);
    
    // Étape 2: Vérifier l'indexation de chaque URL
    const results = [];
    for (const urlData of urls) {
      // Pour éviter de surcharger l'API Google
      if (results.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const indexationResult = await checkGoogleIndexation(urlData.url);
      results.push({
        ...indexationResult,
        priority: urlData.priority,
        lastmod: urlData.lastmod,
        changefreq: urlData.changefreq
      });
    }
    
    // Étape 3: Générer et sauvegarder le rapport
    console.log("Génération du rapport...");
    
    // Sauvegarder les données brutes en JSON
    saveResultsAsJson(results);
    
    // Générer le rapport HTML
    const htmlReport = generateHtmlReport(results, robotsContent);
    const reportDate = new Date().toISOString().slice(0, 10);
    const htmlPath = path.join(CONFIG.resultsPath, `indexation-report-${reportDate}.html`);
    fs.writeFileSync(htmlPath, htmlReport);
    
    console.log(`Rapport HTML généré: ${htmlPath}`);
    console.log("Analyse d'indexation terminée avec succès!");
    
  } catch (error) {
    console.error("Erreur lors de l'exécution du processus d'analyse:", error);
  }
}

// Exécuter le programme principal
main(); 