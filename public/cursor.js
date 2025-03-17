// Effet de curseur personnalisé avec traînée fluide
// Conserve le curseur d'origine et ajoute une traînée élégante

// Vérification si le DOM est prêt avant d'exécuter le script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCursor);
} else {
    initCursor();
}

function initCursor() {
    // Création du conteneur principal
    const cursorContainer = document.createElement('div');
    cursorContainer.classList.add('cursor-container');
    cursorContainer.style.zIndex = '99999';
    document.body.appendChild(cursorContainer);
    
    // Création des éléments de traînée
    const numParticles = 25; // Nombre de particules pour la traînée
    const particles = [];
    
    // Création de chaque particule de la traînée
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'cursor-particle';
        
        // Style des particules avec variation de couleur
        const hue = 350 + (i % 20); // Variation subtile de teinte (rose/rouge)
        const opacity = 1 - (i / numParticles);
        const scale = 1 - (i * 0.03);
        
        particle.style.background = `hsla(${hue}, 100%, 70%, ${opacity})`;
        particle.style.transform = `translate(-50%, -50%) scale(${scale})`;
        particle.style.zIndex = 99999 - i;
        
        cursorContainer.appendChild(particle);
        particles.push({
            element: particle,
            x: 0,
            y: 0,
            latency: i * 0.08 // Délai progressif pour l'effet de traînée
        });
    }

    // Variables pour le suivi de la position
    let mouseX = 0;
    let mouseY = 0;
    let prevMouseX = 0;
    let prevMouseY = 0;
    const positions = [];
    let animationActive = false;
    let mouseSpeed = 0;
    let mouseAngle = 0;
    
    // Fonction d'interpolation pour le mouvement fluide
    function lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // Mise à jour des positions des particules
    function updateParticlePositions() {
        // Calcul de la vitesse et de l'angle du mouvement
        const dx = mouseX - prevMouseX;
        const dy = mouseY - prevMouseY;
        mouseSpeed = Math.sqrt(dx * dx + dy * dy);
        mouseAngle = Math.atan2(dy, dx);
        
        prevMouseX = mouseX;
        prevMouseY = mouseY;
        
        // Ajout de la position actuelle à l'historique
        positions.unshift({ x: mouseX, y: mouseY, speed: mouseSpeed, angle: mouseAngle });
        
        // Limitation de l'historique des positions
        if (positions.length > numParticles * 2) {
            positions.pop();
        }
        
        // Mise à jour de chaque particule
        particles.forEach((particle, index) => {
            // Trouver la position correspondante dans l'historique
            const posIndex = Math.min(Math.floor(particle.latency * 10), positions.length - 1);
            const targetPos = positions[posIndex] || positions[positions.length - 1];
            
            if (targetPos) {
                // Interpolation pour un mouvement plus fluide
                particle.x = lerp(particle.x, targetPos.x, 0.3);
                particle.y = lerp(particle.y, targetPos.y, 0.3);
                
                // Calculer la taille et l'opacité en fonction de la vitesse
                const speedFactor = Math.min(targetPos.speed * 0.05, 1);
                const size = 8 - (index * 0.25) + (speedFactor * 3);
                const opacity = (1 - (index / numParticles)) * (0.7 + speedFactor * 0.3);
                
                // Application des transformations
                particle.element.style.transform = `translate(${particle.x}px, ${particle.y}px) scale(${1 - (index * 0.03)})`;
                particle.element.style.width = `${size}px`;
                particle.element.style.height = `${size}px`;
                particle.element.style.opacity = opacity;
                
                // Effet d'étirement suivant la direction du mouvement
                if (mouseSpeed > 5 && index < numParticles / 2) {
                    const stretch = Math.min(1 + (mouseSpeed * 0.01), 1.5);
                    const rotationDeg = (mouseAngle * 180 / Math.PI);
                    particle.element.style.transform = `translate(${particle.x}px, ${particle.y}px) rotate(${rotationDeg}deg) scale(${stretch}, 1) scale(${1 - (index * 0.03)})`;
                }
            }
        });
        
        if (animationActive) {
            requestAnimationFrame(updateParticlePositions);
        }
    }

    // Gestion des événements de la souris
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Démarrer l'animation si ce n'est pas déjà fait
        if (!animationActive) {
            animationActive = true;
            requestAnimationFrame(updateParticlePositions);
        }
    });

    // Gestion des éléments interactifs
    const interactiveElements = document.querySelectorAll('a, button, .offer-card, .advantage-card, input, select, textarea, [role="button"], .plan');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            // Effet spécial sur les éléments interactifs
            particles.forEach((particle, index) => {
                particle.element.classList.add('particle-hover');
                
                // Animation d'écartement des particules
                setTimeout(() => {
                    const angle = (index / numParticles) * Math.PI * 2;
                    const distance = 3 + (index % 3) * 2;
                    const offsetX = Math.cos(angle) * distance;
                    const offsetY = Math.sin(angle) * distance;
                    
                    particle.element.style.transform = `translate(calc(${particle.x}px + ${offsetX}px), calc(${particle.y}px + ${offsetY}px))`;
                }, index * 10);
            });
        });

        element.addEventListener('mouseleave', () => {
            particles.forEach(particle => {
                particle.element.classList.remove('particle-hover');
            });
        });
    });

    // Effet au clic
    document.addEventListener('mousedown', () => {
        particles.forEach((particle, index) => {
            // Animation d'expansion au clic
            particle.element.style.transform = `translate(${particle.x}px, ${particle.y}px) scale(${1.2 - (index * 0.04)})`;
            setTimeout(() => {
                if (animationActive) { // Vérifier que l'animation est toujours active
                    particle.element.style.transform = `translate(${particle.x}px, ${particle.y}px) scale(${1 - (index * 0.03)})`;
                }
            }, 200);
        });
    });

    // Conserver le curseur d'origine
    document.body.style.cursor = 'auto';
    
    // Désactiver l'effet sur mobile
    const checkMobile = () => {
        if (window.matchMedia('(max-width: 768px)').matches || 
            window.matchMedia('(pointer: coarse)').matches || 
            'ontouchstart' in window) {
            cursorContainer.style.display = 'none';
            document.body.style.cursor = 'auto';
            animationActive = false;
            
            // Réinitialiser les styles des éléments interactifs
            interactiveElements.forEach(element => {
                element.style.cursor = 'pointer';
            });
        } else {
            cursorContainer.style.display = 'block';
            animationActive = true;
            requestAnimationFrame(updateParticlePositions);
        }
    };
    
    // Vérifier au chargement et au redimensionnement
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Démarrer l'animation
    animationActive = true;
    requestAnimationFrame(updateParticlePositions);
} 