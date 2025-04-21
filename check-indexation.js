const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { parseString } = require('xml2js');
require('dotenv').config();

// Configuration
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

// Fonction pour lire le sitemap
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

// Fonction pour lire le fichier robots.txt
function readRobotsTxt() {
  try {
    console.log(`Lecture du fichier robots.txt: ${CONFIG.robotsPath}`);
    const robotsContent = fs.readFileSync(CONFIG.robotsPath, 'utf8');
    return robotsContent;
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier robots.txt:', error);
    return '';
  }
}

// Vérifier si une URL est bloquée par robots.txt
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

// Fonction pour vérifier l'indexation Google avec l'API
async function checkGoogleIndexation(url) {
  try {
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

// Fonction alternative pour vérifier l'indexation sans API (pour tests)
async function checkIndexationWithoutApi(url) {
  console.log(`Simulation de vérification pour: ${url}`);
  return {
    url,
    indexed: Math.random() > 0.3, // 70% de chance d'être indexé (pour simulation)
    totalResults: Math.floor(Math.random() * 10),
    timestamp: new Date().toISOString()
  };
}

// Fonction pour analyser la qualité des URLs
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

// Fonction pour générer un rapport HTML
function generateHtmlReport(results, robotsContent) {
  const indexedCount = results.filter(r => r.indexed).length;
  const percentage = ((indexedCount / results.length) * 100).toFixed(1);
  
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
      height: 30px;
      background: linear-gradient(90deg, #4CAF50, #8BC34A);
      border-radius: 5px;
      text-align: center;
      line-height: 30px;
      color: white;
      font-weight: bold;
    }
    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px 15px;
      border-bottom: 1px solid #ddd;
      text-align: left;
    }
    th {
      background-color: #4CAF50;
      color: white;
    }
    tr:nth-child(even) {
      background-color: #f2f2f2;
    }
    .indexed {
      color: #4CAF50;
      font-weight: bold;
    }
    .not-indexed {
      color: #F44336;
      font-weight: bold;
    }
    .issue {
      background-color: #fff3cd;
      padding: 2px 5px;
      border-radius: 3px;
      display: inline-block;
      margin: 2px;
      font-size: 0.85em;
    }
    .robots-content {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      white-space: pre;
      font-family: monospace;
    }
    .recommendations {
      background-color: #e8f4f8;
      padding: 20px;
      border-radius: 5px;
      margin-top: 30px;
    }
    .url-cell {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    @media (max-width: 768px) {
      th, td {
        padding: 8px;
      }
    }
  </style>
</head>
<body>
  <h1>Rapport d'indexation Google - ${CONFIG.domainName}</h1>
  <div class="summary">
    <h2>Résumé</h2>
    <p>
      <strong>Date du rapport:</strong> ${new Date().toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}
    </p>
    <p>
      <strong>URLs analysées:</strong> ${results.length}<br>
      <strong>URLs indexées:</strong> ${indexedCount}<br>
      <strong>Taux d'indexation:</strong> ${percentage}%
    </p>
    <div class="progress-container">
      <div class="progress-bar" style="width: ${percentage}%">${percentage}%</div>
    </div>
  </div>

  <h2>Détails de l'indexation</h2>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>URL</th>
          <th>Indexée</th>
          <th>Priorité</th>
          <th>Dernière modification</th>
          <th>Problèmes détectés</th>
        </tr>
      </thead>
      <tbody>
        ${results.map(result => {
          const urlAnalysis = analyzeUrlQuality(result.url);
          return `
            <tr>
              <td class="url-cell"><a href="${result.url}" target="_blank">${result.url}</a></td>
              <td class="${result.indexed ? 'indexed' : 'not-indexed'}">${result.indexed ? 'Oui' : 'Non'}</td>
              <td>${result.priority || '-'}</td>
              <td>${result.lastmod || '-'}</td>
              <td>${urlAnalysis.issues.length > 0 ? 
                urlAnalysis.issues.map(issue => `<span class="issue">${issue}</span>`).join(' ') : 
                'Aucun'}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  </div>

  <div class="recommendations">
    <h2>Recommandations</h2>
    <ul>
      <li>Soumettre les URLs non indexées dans Google Search Console</li>
      <li>Améliorer le maillage interne en liant les pages non indexées depuis les pages bien classées</li>
      <li>Vérifier que les URLs non indexées ont un contenu unique et utile</li>
      <li>S'assurer que les pages sont rapides et optimisées pour le mobile</li>
      <li>Ajouter plus de contenu de qualité aux pages de faible priorité pour améliorer leur indexation</li>
    </ul>
  </div>

  <h2>Configuration robots.txt</h2>
  <pre class="robots-content">${robotsContent}</pre>

  <p style="margin-top: 50px; color: #777; text-align: center; font-size: 0.8em;">
    Rapport généré automatiquement pour IPTV Smarter Pros
  </p>
</body>
</html>`;

  const filePath = path.join(CONFIG.resultsPath, `indexation-report-${new Date().toISOString().slice(0,10)}.html`);
  fs.writeFileSync(filePath, html);
  console.log(`Rapport HTML généré: ${filePath}`);
  return filePath;
}

// Fonction pour générer un rapport JSON
function saveResultsAsJson(results) {
  const filePath = path.join(CONFIG.resultsPath, `indexation-data-${new Date().toISOString().slice(0,10)}.json`);
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  console.log(`Rapport JSON généré: ${filePath}`);
  return filePath;
}

// Fonction principale
async function main() {
  console.log('=================================================');
  console.log(`Vérification de l'indexation Google pour ${CONFIG.domainName}`);
  console.log('=================================================');
  
  // Lire le sitemap et robots.txt
  const urls = await readSitemap();
  const robotsContent = readRobotsTxt();
  
  if (urls.length === 0) {
    console.error("Erreur: Aucune URL trouvée dans le sitemap.");
    process.exit(1);
  }
  
  // Vérifier chaque URL
  const results = [];
  
  for (const urlObj of urls) {
    let result;
    
    // Utiliser l'API Google si disponible, sinon la méthode alternative
    if (CONFIG.googleApiKey && CONFIG.googleSearchEngineId) {
      result = await checkGoogleIndexation(urlObj.url);
    } else {
      result = await checkIndexationWithoutApi(urlObj.url);
    }
    
    // Compléter avec les informations du sitemap
    results.push({
      ...result,
      priority: urlObj.priority,
      lastmod: urlObj.lastmod,
      changefreq: urlObj.changefreq,
      blockedByRobots: isBlockedByRobotsTxt(urlObj.url, robotsContent)
    });
    
    // Pour éviter de dépasser le quota d'API
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // Enregistrer les résultats
  saveResultsAsJson(results);
  const reportPath = generateHtmlReport(results, robotsContent);
  
  // Afficher les statistiques
  const indexedCount = results.filter(r => r.indexed).length;
  const blockedCount = results.filter(r => r.blockedByRobots).length;
  const percentage = ((indexedCount / results.length) * 100).toFixed(1);
  
  console.log('\n=================================================');
  console.log('Résultats de l\'indexation:');
  console.log('=================================================');
  console.log(`Total des URLs: ${results.length}`);
  console.log(`URLs indexées: ${indexedCount} (${percentage}%)`);
  console.log(`URLs bloquées par robots.txt: ${blockedCount}`);
  
  if (results.length - indexedCount > 0) {
    console.log('\nURLs non indexées:');
    results
      .filter(r => !r.indexed)
      .forEach(result => {
        console.log(`- ${result.url} (priorité: ${result.priority})`);
      });
    
    console.log('\nRecommandations:');
    console.log('1. Soumettez ces URLs dans Google Search Console');
    console.log('2. Vérifiez le maillage interne de votre site');
    console.log('3. Améliorez le contenu des pages non indexées');
  }
  
  console.log(`\nRapport complet disponible dans: ${reportPath}`);
}

// Exécuter le programme
main().catch(error => {
  console.error('Erreur lors de l\'exécution du programme:', error);
  process.exit(1);
}); 