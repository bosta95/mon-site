// Optimisation du JavaScript pour alléger les ressources inutiles

// Vérification si le DOM est prêt avant d'exécuter le script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCursor);
} else {
    initCursor();
}

function initCursor() {
    // Création d'un conteneur pour le curseur et ses éléments
    const cursorContainer = document.createElement('div');
    cursorContainer.classList.add('cursor-container');
    cursorContainer.style.zIndex = '99999'; // Augmentation significative du z-index pour garantir que le curseur reste au-dessus de tous les éléments
    document.body.appendChild(cursorContainer);
    
    const cursor = document.createElement('div');
    cursor.classList.add('cursor-dot');
    cursorContainer.appendChild(cursor);

    // Création des points de traînée
    const numTrails = 20; // Augmentation du nombre de points pour une traînée plus fluide
    const trails = [];
    
    for (let i = 0; i < numTrails; i++) {
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        trail.style.background = `rgba(255, 140, 140, ${1 - (i / numTrails)})`; // Dégradé de couleur
        cursorContainer.appendChild(trail);
        trails.push({
            element: trail,
            x: 0,
            y: 0
        });
    }

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    const positions = []; // Stockage des positions précédentes

    function lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    function updateCursor() {
        // Mise à jour de la position du curseur principal avec effet de lissage
        currentX = lerp(currentX, mouseX, 0.2);
        currentY = lerp(currentY, mouseY, 0.2);
        
        cursor.style.transform = `translate(${currentX}px, ${currentY}px)`;

        // Ajout de la position actuelle au début du tableau
        positions.unshift({ x: currentX, y: currentY });

        // Limitation du nombre de positions stockées
        if (positions.length > numTrails) {
            positions.pop();
        }

        // Mise à jour des points de traînée
        trails.forEach((trail, index) => {
            if (positions[index]) {
                const pos = positions[index];
                trail.x = pos.x;
                trail.y = pos.y;

                // Calcul de la taille et de l'opacité en fonction de la position
                const size = 8 - (index * 0.3);
                const opacity = 1 - (index / numTrails);

                trail.element.style.transform = `translate(${trail.x}px, ${trail.y}px)`;
                trail.element.style.width = `${size}px`;
                trail.element.style.height = `${size}px`;
                trail.element.style.opacity = opacity;
            }
        });

        requestAnimationFrame(updateCursor);
    }

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        if (!cursor.style.opacity) {
            cursor.style.opacity = '1';
            requestAnimationFrame(updateCursor);
        }
    });

    // Gestion des éléments interactifs avec une meilleure détection
    const interactiveElements = document.querySelectorAll('a, button, .offer-card, .advantage-card, input, select, textarea, [role="button"]');
    
    interactiveElements.forEach(element => {
        // Assurer que les éléments interactifs ont un z-index inférieur au curseur
        if (!element.style.zIndex || parseInt(element.style.zIndex) >= 10000) {
            element.style.position = element.style.position || 'relative';
            element.style.zIndex = '1';
        }
        
        element.addEventListener('mouseenter', () => {
            cursor.classList.add('cursor-hover');
            trails.forEach(trail => {
                trail.element.classList.add('trail-hover');
            });
        });

        element.addEventListener('mouseleave', () => {
            cursor.classList.remove('cursor-hover');
            trails.forEach(trail => {
                trail.element.classList.remove('trail-hover');
            });
        });
    });

    document.addEventListener('mousedown', () => {
        cursor.style.transform = 'scale(0.8)';
        trails.forEach(trail => {
            trail.element.style.opacity = '0.5';
        });
    });

    document.addEventListener('mouseup', () => {
        cursor.style.transform = 'scale(1)';
        trails.forEach(trail => {
            trail.element.style.opacity = '0.7';
        });
    });

    // Désactiver le curseur par défaut
    document.body.style.cursor = 'none';
    
    // Réactiver le curseur par défaut sur les appareils mobiles
    if (window.matchMedia('(max-width: 768px)').matches) {
        document.body.style.cursor = 'auto';
        cursorContainer.style.display = 'none';
    }

    cursor.style.opacity = '1'; // Assurer que le curseur principal est toujours visible
    updateCursor();
} 