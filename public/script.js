document.addEventListener("DOMContentLoaded", function () {
    console.log("Script chargé avec succès ! 🚀");

    // Activer le Lazy Loading pour toutes les images
    const images = document.querySelectorAll("img");
    images.forEach(img => {
        img.setAttribute("loading", "lazy");
    });

    // Ajout d'une animation d'apparition au scroll
    const elements = document.querySelectorAll(".fade-in");
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    
    elements.forEach(element => {
        observer.observe(element);
    });

    // Optimisation de la gestion des liens externes
    document.querySelectorAll("a[target='_blank']").forEach(link => {
        link.setAttribute("rel", "noopener noreferrer");
    });

    // Gestion améliorée du menu mobile pour toutes les pages
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const headerNav = document.querySelector('.header-nav');
    
    if (mobileMenuToggle && headerNav) {
        // Fonction pour ouvrir/fermer le menu
        function toggleMenu() {
            mobileMenuToggle.classList.toggle('active');
            
            // Éviter de figer la page entière
            if (!headerNav.classList.contains('active')) {
                // Si on ouvre le menu
                headerNav.style.display = 'block'; // Force l'affichage immédiat
                headerNav.style.background = '#0f0f19'; // Fond noir solide
                headerNav.style.backdropFilter = 'none'; // Aucun flou
                headerNav.style.webkitBackdropFilter = 'none'; // Aucun flou
                headerNav.classList.add('active');
                
                // Ne pas ajouter la classe menu-open pour éviter le flou et le blocage
                // document.body.classList.add('menu-open');
            } else {
                // Si on ferme le menu
                headerNav.classList.remove('active');
                document.body.classList.remove('menu-open');
                // Attendre la fin de l'animation avant de cacher
                setTimeout(() => {
                    if (!headerNav.classList.contains('active')) {
                        headerNav.style.removeProperty('display');
                    }
                }, 300); // Délai correspondant à la transition CSS
            }
        }
        
        // Fonction pour fermer le menu
        function closeMenu() {
            mobileMenuToggle.classList.remove('active');
            headerNav.classList.remove('active');
            document.body.classList.remove('menu-open');
            // Attendre la fin de l'animation avant de cacher
            setTimeout(() => {
                if (!headerNav.classList.contains('active')) {
                    headerNav.style.removeProperty('display');
                }
            }, 300); // Délai correspondant à la transition CSS
        }
        
        // Nettoyer les styles au chargement de la page pour éviter tout flou résiduel
        headerNav.style.backdropFilter = 'none';
        headerNav.style.webkitBackdropFilter = 'none';
        
        // Supprimer tout flou résiduel sur le document entier
        document.body.style.backdropFilter = 'none';
        document.body.style.webkitBackdropFilter = 'none';
        
        // Gestionnaire d'événement pour le bouton de menu
        mobileMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation(); // Empêche la propagation
            toggleMenu();
        });
        
        // Fermer le menu quand on clique sur un lien
        const navLinks = document.querySelectorAll('.header-nav ul li a');
        navLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });
        
        // Fermer le menu quand on clique en dehors
        document.addEventListener('click', function(e) {
            // Si le menu est ouvert et qu'on clique en dehors du menu
            if (headerNav.classList.contains('active') && 
                !headerNav.contains(e.target) && 
                e.target !== mobileMenuToggle && 
                !mobileMenuToggle.contains(e.target)) {
                closeMenu();
            }
        });
        
        // Empêcher la fermeture quand on clique à l'intérieur du menu
        headerNav.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    console.log("Toutes les optimisations JS sont en place ! ⚡");

    // Gestion de la bannière fixe - uniquement sur la page d'accueil
    const fixedFooter = document.querySelector('.fixed-footer');
    
    // Vérifier si nous sommes sur la page d'accueil et si la bannière existe
    const isHomePage = window.location.pathname === '/' || 
                       window.location.pathname === '/index.html' || 
                       window.location.href.includes('index.html');
    
    if (fixedFooter && isHomePage) {
        // Récupérer l'état stocké dans localStorage
        const hiddenTime = localStorage.getItem('fixedFooterHidden');
        if (hiddenTime) {
            const now = Date.now();
            const oneHour = 60 * 60 * 1000; // 1 heure en millisecondes
            if (now - hiddenTime > oneHour) {
                // Si plus d'une heure s'est écoulée, on supprime l'état et on réaffiche
                localStorage.removeItem('fixedFooterHidden');
                fixedFooter.classList.remove('hide');
                fixedFooter.style.transform = 'translateY(0)';
            } else {
                // Programmer la réapparition après le temps restant
                const timeRemaining = oneHour - (now - hiddenTime);
                setTimeout(function() {
                    fixedFooter.classList.remove('hide');
                    localStorage.removeItem('fixedFooterHidden');
                }, timeRemaining);
            }
        }
        
        // Gestion du bouton de fermeture
        const hideFixedFooter = document.getElementById('hideFixedFooter');
        if (hideFixedFooter) {
            hideFixedFooter.addEventListener('click', function() {
                fixedFooter.classList.add('hide');
                localStorage.setItem('fixedFooterHidden', Date.now());
            });
        }
    } else if (fixedFooter && !isHomePage) {
        // Si ce n'est pas la page d'accueil, masquer la bannière
        fixedFooter.style.display = 'none';
    }
});
