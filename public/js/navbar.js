// Gestion du menu mobile
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const headerNav = document.querySelector('.header-nav');
    
    if (mobileMenuToggle && headerNav) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenuToggle.classList.toggle('active');
            headerNav.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
    }
    
    // Fermer le menu quand on clique sur un lien
    const navLinks = document.querySelectorAll('.header-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileMenuToggle.classList.remove('active');
            headerNav.classList.remove('active');
            document.body.classList.remove('menu-open');
        });
    });
}); 