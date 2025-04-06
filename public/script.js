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

    console.log("Toutes les optimisations JS sont en place ! ⚡");

    // Fonction pour gérer le menu hamburger mobile
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const headerNav = document.querySelector('.header-nav');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenuToggle.classList.toggle('active');
            headerNav.classList.toggle('active');
        });
    }
    
    // Fermer le menu quand on clique sur un lien
    const navLinks = document.querySelectorAll('.header-nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileMenuToggle.classList.remove('active');
            headerNav.classList.remove('active');
        });
    });
    
    // Restaurer l'affichage de la bannière fixe si elle a été masquée
    const fixedFooter = document.querySelector('.fixed-footer');
    if (fixedFooter) {
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
    }
});
