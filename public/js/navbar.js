document.addEventListener('DOMContentLoaded', function() {
  // Gestion du menu mobile
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const headerNav = document.querySelector('.header-nav');
  
  if (mobileMenuToggle && headerNav) {
    mobileMenuToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      headerNav.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    });
  }

  // Fermer le menu mobile quand on clique sur un lien
  const navLinks = document.querySelectorAll('.header-nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (headerNav.classList.contains('active')) {
        headerNav.classList.remove('active');
        if (mobileMenuToggle) mobileMenuToggle.classList.remove('active');
        document.body.classList.remove('menu-open');
      }
    });
  });
}); 