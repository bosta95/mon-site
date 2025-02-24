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
});
