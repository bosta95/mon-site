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

    // Gestion du menu mobile pour toutes les pages
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const headerNav = document.querySelector('.header-nav');
    
    if (mobileMenuToggle && headerNav) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenuToggle.classList.toggle('active');
            headerNav.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        
        // Fermer le menu quand on clique sur un lien
        const navLinks = document.querySelectorAll('.header-nav ul li a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenuToggle.classList.remove('active');
                headerNav.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
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
