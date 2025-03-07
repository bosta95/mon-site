document.addEventListener('DOMContentLoaded', () => {
    // Création du conteneur du curseur
    const cursorContainer = document.createElement('div');
    cursorContainer.className = 'cursor-container';
    document.body.appendChild(cursorContainer);

    // Création du point principal du curseur
    const cursor = document.createElement('div');
    cursor.className = 'cursor-dot';
    cursorContainer.appendChild(cursor);

    // Création des segments de traînée
    const numTrails = 12;
    const trails = [];
    
    for (let i = 0; i < numTrails; i++) {
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        cursorContainer.appendChild(trail);
        trails.push({
            element: trail,
            x: 0,
            y: 0,
            angle: 0,
            speed: 0
        });
    }

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let lastX = 0;
    let lastY = 0;
    const ease = 0.35;

    // Utilisation de performance.now() pour une animation plus fluide
    let lastTime = performance.now();

    function updateCursor(currentTime) {
        const deltaTime = (currentTime - lastTime) / 16;
        lastTime = currentTime;

        // Calcul de la vélocité avec plus de précision
        const velocityX = (mouseX - lastX) / deltaTime;
        const velocityY = (mouseY - lastY) / deltaTime;
        const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        const angle = Math.atan2(velocityY, velocityX);
        
        lastX = mouseX;
        lastY = mouseY;

        // Mise à jour du curseur principal
        currentX += (mouseX - currentX) * ease * deltaTime;
        currentY += (mouseY - currentY) * ease * deltaTime;
        
        cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

        // Mise à jour des segments de traînée avec effet de décalage progressif
        trails.forEach((trail, index) => {
            const delay = index * 0.08;
            const trailEase = ease - (index * 0.02);
            
            // Position avec effet de traînée plus prononcé
            trail.x += (mouseX - trail.x) * trailEase * deltaTime;
            trail.y += (mouseY - trail.y) * trailEase * deltaTime;

            // Calcul de l'angle avec effet de lissage
            const targetAngle = speed < 0.1 ? trail.angle : angle;
            trail.angle += (targetAngle - trail.angle) * trailEase * deltaTime;

            // Ajustement dynamique de la longueur et de l'opacité
            const opacity = 1 - (index / numTrails);
            const length = Math.min(40 + (speed * 0.8), 80);
            const scale = 1 - (index * 0.05);

            trail.element.style.transform = `
                translate3d(${trail.x}px, ${trail.y}px, 0)
                rotate(${trail.angle}rad)
                scaleX(${scale})
            `;
            trail.element.style.opacity = opacity;
            trail.element.style.height = `${length}px`;
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
    }, { passive: true });

    // Gestion optimisée des éléments interactifs
    const interactiveElements = document.querySelectorAll('a, button, .offer-card, .advantage-card');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursor.classList.add('cursor-hover');
            trails.forEach(trail => trail.element.classList.add('trail-hover'));
        });

        element.addEventListener('mouseleave', () => {
            cursor.classList.remove('cursor-hover');
            trails.forEach(trail => trail.element.classList.remove('trail-hover'));
        });
    });
}); 