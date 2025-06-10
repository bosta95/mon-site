document.addEventListener('DOMContentLoaded', function() {
    
    // =================================================================================
    // LOGIQUE DE LA NAVBAR (déjà présente dans navbar.js, juste pour référence)
    // =================================================================================
    // Note: Le code de gestion du menu mobile (clic sur le hamburger)
    // est dans le fichier séparé `navbar.js` et est déjà optimisé.

    // =================================================================================
    // SCRIPT DE GESTION DE LA VIDÉO HERO
    // =================================================================================
    const heroVideo = document.getElementById('heroVideo');
    if (heroVideo) {
        // Fonction pour forcer le chargement et l'affichage de la vidéo
        function forceVideoLoad() {
            heroVideo.load();
            heroVideo.play().catch(e => console.error("Erreur de lecture de la vidéo hero:", e));
        }

        // Événement pour marquer la vidéo comme chargée quand les données sont prêtes
        heroVideo.addEventListener('loadeddata', function() {
            this.classList.add('loaded');
        });

        // Si la vidéo est déjà prête (cas de mise en cache)
        if (heroVideo.readyState >= 3) {
            heroVideo.classList.add('loaded');
        } else {
            // Sinon, on s'assure qu'elle se charge
            forceVideoLoad();
        }
    }

    // =================================================================================
    // SCRIPT DE LAZY LOADING POUR LES AFFICHES DE FILMS
    // =================================================================================
    const lazyFilms = document.querySelectorAll('.lazy-film');
    const filmsSection = document.querySelector('.films-slider-section');

    if (lazyFilms.length > 0 && filmsSection) {
        const filmObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    if (src) {
                        const tempImg = new Image();
                        tempImg.onload = () => {
                            img.src = src;
                            img.classList.remove('lazy-film');
                            img.classList.add('loaded');
                        };
                        tempImg.src = src;
                    }
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '50px' });

        const sectionObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    lazyFilms.forEach(img => filmObserver.observe(img));
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '100px' });
        
        sectionObserver.observe(filmsSection);
    }
    
    // =================================================================================
    // SCRIPT DE MISE À JOUR DYNAMIQUE DES PRIX DES OFFRES
    // =================================================================================
    const screenSelectors = document.querySelectorAll('.screens-select');
    screenSelectors.forEach(selector => {
        selector.addEventListener('change', function() {
            const offerCard = this.closest('.offer-card');
            if (!offerCard) return;

            const priceElement = offerCard.querySelector('.price');
            const commandButton = offerCard.querySelector('.offer-command-btn');
            if (!priceElement || !commandButton) return;

            const basePrice = parseFloat(commandButton.getAttribute('data-base-price') || '0');
            const screens = parseInt(this.value, 10);
            
            let additionalPrice = 0;
            const options = Array.from(this.options);
            const selectedOption = options.find(opt => parseInt(opt.value, 10) === screens);

            if (selectedOption) {
                const priceText = selectedOption.textContent.match(/\(\+([0-9]+)€\)/);
                if (priceText && priceText[1]) {
                    additionalPrice = parseFloat(priceText[1]);
                }
            }

            const newPrice = basePrice + additionalPrice;

            priceElement.style.transform = 'scale(1.1)';
            priceElement.style.color = '#E74C3C';
            
            setTimeout(() => {
                priceElement.textContent = `${newPrice.toFixed(2)}€`;
                priceElement.style.transform = 'scale(1)';
                priceElement.style.color = ''; // Rétablit la couleur par défaut du CSS
            }, 150);

            const baseHref = commandButton.href.split('?')[0];
            const newHref = `${baseHref}?ecrans=${screens}&prix=${newPrice.toFixed(2)}`;
            commandButton.href = newHref;
        });
    });

    // =================================================================================
    // SCRIPT DE CHARGEMENT ET GESTION DU CARROUSEL DE TÉMOIGNAGES
    // =================================================================================
    const testimonialsTrack = document.getElementById('testimonialsTrack');
    if (testimonialsTrack) {
        let currentPosition = 0;
        let testimonials = [];
        let autoScrollInterval;

        const getStarsHTML = (rating) => {
            let stars = '';
            for (let i = 1; i <= 5; i++) {
                stars += `<i class="fa${i <= rating ? 's' : 'r'} fa-star"></i>`;
            }
            return stars;
        };

        const getInitial = (name) => name.charAt(0).toUpperCase();

        const formatProductName = (productCode) => {
            const productMap = {
                'Premium_IPTV_3_mois': 'Abonnement 3 mois',
                'Premium_IPTV_6_mois': 'Abonnement 6 mois',
                'Premium_IPTV_12_mois': 'Abonnement 12 mois',
            };
            return productMap[productCode] || 'Abonnement Premium';
        };
        
        const setupCarousel = () => {
            const cards = testimonialsTrack.querySelectorAll('.testimonial-card');
            if (cards.length === 0) return;

            const cardsPerView = window.innerWidth >= 992 ? 3 : (window.innerWidth >= 768 ? 2 : 1);
            const totalCards = cards.length;

            // Cloner les cartes pour un effet de boucle infini
            for (let i = 0; i < cardsPerView; i++) {
                if (cards[i]) {
                   const clone = cards[i].cloneNode(true);
                   testimonialsTrack.appendChild(clone);
                }
            }
            
            let currentIndex = 0;

            const updateCarousel = () => {
                currentIndex++;
                testimonialsTrack.style.transition = 'transform 0.7s ease';
                const offset = -currentIndex * (100 / cardsPerView);
                testimonialsTrack.style.transform = `translateX(${offset}%)`;

                if (currentIndex >= totalCards) {
                    setTimeout(() => {
                        testimonialsTrack.style.transition = 'none';
                        testimonialsTrack.style.transform = 'translateX(0)';
                        currentIndex = 0;
                    }, 700);
                }
            };
            
            startAutoScroll(updateCarousel);
        };

        const startAutoScroll = (updateFunction) => {
            if (autoScrollInterval) clearInterval(autoScrollInterval);
            autoScrollInterval = setInterval(updateFunction, 4000); // Ralentissement à 4s pour une meilleure lisibilité
            
            const carousel = testimonialsTrack.closest('.testimonials-carousel');
            carousel.addEventListener('mouseenter', () => clearInterval(autoScrollInterval));
            carousel.addEventListener('mouseleave', () => {
                if (autoScrollInterval) clearInterval(autoScrollInterval);
                autoScrollInterval = setInterval(updateFunction, 4000);
            });
        };

        const loadTestimonials = async () => {
            try {
                testimonialsTrack.innerHTML = `<div class="loading-testimonials"><div></div><div></div><div></div></div>`;
                
                const demoReviews = [
                    { name: "Thomas D.", rating: 5, comment: "Service incroyable, très satisfait de la qualité et de la stabilité. Je recommande fortement !", product: "Premium_IPTV_12_mois" },
                    { name: "Sophie M.", rating: 4, comment: "Très bonne qualité d'image, quelques coupures rares. Support client réactif.", product: "Premium_IPTV_6_mois" },
                    { name: "Pierre L.", rating: 5, comment: "Interface simple, installation rapide, fonctionne parfaitement sur ma Smart TV.", product: "Premium_IPTV_3_mois" },
                    { name: "Marie F.", rating: 5, comment: "Excellent service, j'apprécie les chaînes sportives et le catalogue de films.", product: "Premium_IPTV_6_mois" },
                    { name: "Laurent B.", rating: 4, comment: "Bon rapport qualité-prix, service stable et interface intuitive. Recommandé !", product: "Premium_IPTV_12_mois" },
                    { name: "Julien R.", rating: 5, comment: "Qualité 4K impeccable, large choix de chaînes. Très satisfait.", product: "Premium_IPTV_12_mois" }
                ];

                try {
                    const response = await fetch('/api/reviews');
                    if (response.ok) {
                        const data = await response.json();
                        testimonials = (data.reviews && data.reviews.length > 0) ? data.reviews : demoReviews;
                    } else {
                        testimonials = demoReviews;
                    }
                } catch (apiError) {
                    console.warn("API des avis non disponible, utilisation des avis de démonstration.", apiError);
                    testimonials = demoReviews;
                }

                testimonialsTrack.innerHTML = '';
                
                testimonials.forEach(testimonial => {
                    const card = document.createElement('article'); // Utilisation de <article> pour la sémantique
                    card.className = 'testimonial-card';
                    card.innerHTML = `
                      <div class="testimonial-rating">${getStarsHTML(testimonial.rating)}</div>
                      <p class="testimonial-content">"${testimonial.comment}"</p>
                      <div class="testimonial-author-container">
                        <div class="testimonial-avatar">${getInitial(testimonial.name)}</div>
                        <div class="testimonial-info">
                          <div class="testimonial-author">${testimonial.name}</div>
                          <div class="testimonial-product">${formatProductName(testimonial.product)}</div>
                        </div>
                      </div>`;
                    testimonialsTrack.appendChild(card);
                });
                
                setupCarousel();

            } catch (error) {
                console.error('Erreur lors du chargement des avis:', error);
                testimonialsTrack.innerHTML = `<p class="error-message">Impossible de charger les avis pour le moment.</p>`;
            }
        };

        loadTestimonials();
    }
}); 