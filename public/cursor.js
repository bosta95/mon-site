document.addEventListener('DOMContentLoaded', () => {
    // Création du conteneur du curseur
    const cursorContainer = document.createElement('div');
    cursorContainer.className = 'cursor-container';
    document.body.appendChild(cursorContainer);

    // Création du point principal du curseur
    const cursor = document.createElement('div');
    cursor.className = 'cursor-dot';
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
        
        if (!cursorContainer.style.opacity) {
            cursorContainer.style.opacity = '1';
            requestAnimationFrame(updateCursor);
        }
    });

    // Gestion des éléments interactifs
    const interactiveElements = document.querySelectorAll('a, button, .offer-card, .advantage-card');
    
    interactiveElements.forEach(element => {
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
}); 