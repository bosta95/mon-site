document.addEventListener('DOMContentLoaded', function() {
  // Gestion du menu mobile
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const headerNav = document.querySelector('.header-nav');
  const body = document.body;
  
  if (mobileMenuToggle && headerNav) {
    // Fonction pour ouvrir/fermer le menu
    function toggleMenu() {
      const isActive = mobileMenuToggle.classList.contains('active');
      
      if (!isActive) {
        // Ouvrir le menu
        mobileMenuToggle.classList.add('active');
        headerNav.classList.add('active');
        body.classList.add('menu-open');
      } else {
        // Fermer le menu
        closeMenu();
      }
    }
    
    // Fonction pour fermer le menu
    function closeMenu() {
      mobileMenuToggle.classList.remove('active');
      headerNav.classList.remove('active');
      body.classList.remove('menu-open');
    }
    
    // Event listener pour le bouton hamburger
    mobileMenuToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });
    
    // Fermer le menu quand on clique sur l'overlay
    body.addEventListener('click', function(e) {
      if (body.classList.contains('menu-open') && 
          !headerNav.contains(e.target) && 
          !mobileMenuToggle.contains(e.target)) {
        closeMenu();
      }
    });
    
    // Fermer le menu quand on clique sur un lien
    const navLinks = document.querySelectorAll('.header-nav a');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        if (headerNav.classList.contains('active')) {
          closeMenu();
        }
      });
    });
    
    // Fermer le menu avec la touche Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && headerNav.classList.contains('active')) {
        closeMenu();
      }
    });
    
    // Gérer le redimensionnement de la fenêtre
    window.addEventListener('resize', function() {
      if (window.innerWidth > 768 && headerNav.classList.contains('active')) {
        closeMenu();
      }
    });
  }
}); 