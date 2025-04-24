/**
 * Script de correction pour l'affichage mobile et desktop
 * Ce script corrige spécifiquement les problèmes d'affichage sur la page de détail d'offre
 */

document.addEventListener('DOMContentLoaded', function() {
  // Appliquer des corrections pour les cartes d'offres, sur mobile ET desktop
  const fixCardLayout = function() {
    // Cibler les cartes d'offre
    const offerCards = document.querySelectorAll('.offer-card');
    if (offerCards.length > 0) {
      offerCards.forEach(card => {
        // Sur desktop, désactiver le défilement et permettre à la carte de s'étendre
        if (window.innerWidth > 768) {
          // Désactiver le défilement pour desktop
          card.style.overflow = 'visible';
          card.style.maxHeight = 'none';
          card.style.height = 'auto';
          card.style.minHeight = '515px'; // Hauteur minimale pour l'alignement
          card.style.display = 'flex';
          card.style.flexDirection = 'column';
          
          // Mettre le bouton en bas
          const btn = card.querySelector('.btn, button');
          if (btn) {
            btn.style.marginTop = 'auto';
          }
          
          // S'assurer que la liste des avantages n'a pas de défilement
          const benefits = card.querySelector('.benefits');
          if (benefits) {
            benefits.style.overflow = 'visible';
            benefits.style.maxHeight = 'none';
          }
        } 
        // Sur mobile, optimiser l'espace
        else if (window.innerWidth <= 480) {
          // Réinitialiser les hauteurs pour mobile
          card.style.height = 'auto';
          card.style.minHeight = 'auto';
          card.style.maxHeight = 'none';
          card.style.overflow = 'visible';
          
          // Réduire le padding
          card.style.padding = '12px';
          
          // Garantir que la largeur est appropriée
          card.style.width = '90%';
          card.style.maxWidth = '100%';
          card.style.boxSizing = 'border-box';
          
          // Styles des enfants
          const title = card.querySelector('h3');
          if (title) {
            title.style.fontSize = '18px';
            title.style.margin = '0 0 5px 0';
            title.style.padding = '0';
          }
          
          const price = card.querySelector('.price');
          if (price) {
            price.style.fontSize = '22px';
            price.style.margin = '5px 0';
            price.style.padding = '0';
          }
          
          const benefits = card.querySelector('.benefits');
          if (benefits) {
            benefits.style.margin = '5px 0';
            benefits.style.paddingLeft = '5px';
            benefits.style.listStyle = 'none';
            
            const items = benefits.querySelectorAll('li');
            items.forEach(item => {
              item.style.fontSize = '13px';
              item.style.lineHeight = '1.3';
              item.style.marginBottom = '2px';
              item.style.paddingLeft = '15px';
              item.style.position = 'relative';
            });
          }
          
          const selector = card.querySelector('.screens-selector');
          if (selector) {
            selector.style.margin = '5px 0';
            
            const label = selector.querySelector('label');
            if (label) {
              label.style.fontSize = '13px';
              label.style.marginBottom = '3px';
              label.style.display = 'block';
            }
            
            const select = selector.querySelector('select');
            if (select) {
              select.style.width = '100%';
              select.style.padding = '5px';
              select.style.fontSize = '13px';
            }
          }
          
          const btn = card.querySelector('.btn, button');
          if (btn) {
            btn.style.fontSize = '14px';
            btn.style.padding = '6px 12px';
            btn.style.marginTop = '5px';
          }
          
          // Forcer la hauteur de la page principale sur mobile
          const mainContent = document.querySelector('.main-content');
          if (mainContent) {
            mainContent.style.paddingTop = '70px';
            mainContent.style.paddingBottom = '30px';
          }
        }
      });
    }
  };
  
  // Exécuter notre fonction de correction
  fixCardLayout();
  
  // Réexécuter après un court délai pour s'assurer que tous les styles sont appliqués
  setTimeout(fixCardLayout, 300);
  setTimeout(fixCardLayout, 1000);
  
  // Réappliquer lors du redimensionnement de la fenêtre
  window.addEventListener('resize', fixCardLayout);
  
  // Réappliquer lors du chargement complet de la page
  window.addEventListener('load', fixCardLayout);
}); 