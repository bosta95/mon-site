document.addEventListener('DOMContentLoaded', function() {
  // Optimisations performance
  let lastScrollTop = 0;
  let ticking = false;
  
  // Fonction d'throttling pour optimiser les performances
  function throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }
  
  // Gestion du menu mobile optimisée
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const headerNav = document.querySelector('.header-nav');
  const body = document.body;
  
  if (mobileMenuToggle && headerNav) {
    // Variables pour les gestes tactiles
    let startY = 0;
    let currentY = 0;
    let isMenuOpen = false;
    
    // Fonction pour ouvrir/fermer le menu avec animations optimisées
    function toggleMenu() {
      isMenuOpen = !isMenuOpen;
      
      if (isMenuOpen) {
        // Ouvrir le menu avec optimisations GPU
        mobileMenuToggle.classList.add('active');
        headerNav.classList.add('active');
        body.classList.add('menu-open');
        
        // Accessibility
        headerNav.setAttribute('aria-hidden', 'false');
        mobileMenuToggle.setAttribute('aria-expanded', 'true');
        
        // Focus trap
        const firstFocusable = headerNav.querySelector('a');
        if (firstFocusable) {
          setTimeout(() => firstFocusable.focus(), 300);
        }
      } else {
        closeMenu();
      }
    }
    
    // Fonction pour fermer le menu optimisée
    function closeMenu() {
      if (!isMenuOpen) return;
      
      isMenuOpen = false;
      mobileMenuToggle.classList.remove('active');
      headerNav.classList.remove('active');
      body.classList.remove('menu-open');
      
      // Accessibility
      headerNav.setAttribute('aria-hidden', 'true');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
    }
    
    // Event listener optimisé pour le bouton hamburger
    mobileMenuToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    }, { passive: false });
    
    // Gestion tactile améliorée pour fermeture du menu
    let touchStartY = 0;
    let touchEndY = 0;
    
    headerNav.addEventListener('touchstart', function(e) {
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    headerNav.addEventListener('touchend', function(e) {
      touchEndY = e.changedTouches[0].screenY;
      
      // Swipe vers la droite pour fermer le menu
      if (touchStartY - touchEndY > 50 && isMenuOpen) {
        closeMenu();
      }
    }, { passive: true });
    
    // Fermer le menu quand on clique sur l'overlay (optimisé)
    body.addEventListener('click', function(e) {
      if (isMenuOpen && 
          !headerNav.contains(e.target) && 
          !mobileMenuToggle.contains(e.target)) {
        closeMenu();
      }
    }, { passive: true });
    
    // Fermer le menu quand on clique sur un lien (optimisé)
    const navLinks = document.querySelectorAll('.header-nav a');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        if (isMenuOpen) {
          closeMenu();
        }
      }, { passive: true });
    });
    
    // Fermer le menu avec la touche Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isMenuOpen) {
        closeMenu();
        mobileMenuToggle.focus();
      }
    }, { passive: false });
    
    // Gérer le redimensionnement de la fenêtre (throttled)
    const handleResize = throttle(function() {
      if (window.innerWidth > 768 && isMenuOpen) {
        closeMenu();
      }
    }, 250);
    
    window.addEventListener('resize', handleResize, { passive: true });
  }
  
  // Optimisation du scroll - Header compact
  const header = document.querySelector('.header-container');
  let lastKnownScrollPosition = 0;
  
  const updateHeader = throttle(function(scrollPos) {
    if (scrollPos > 100) {
      header.classList.add('compact');
    } else {
      header.classList.remove('compact');
    }
  }, 16); // 60fps
  
  window.addEventListener('scroll', function() {
    lastKnownScrollPosition = window.scrollY;
    
    if (!ticking) {
      requestAnimationFrame(function() {
        updateHeader(lastKnownScrollPosition);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
  
  // Lazy loading optimisé pour les images
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        imageObserver.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });
  
  images.forEach(img => imageObserver.observe(img));
  
  // Smooth scroll pour les ancres
  const anchors = document.querySelectorAll('a[href^="#"]');
  anchors.forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, { passive: false });
  });
  
  // Preload critical images
  const criticalImages = [
    './images/logo.svg',
    './images/dragon.webp'
  ];
  
  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
  
  // Performance monitoring
  if ('performance' in window && 'measure' in window.performance) {
    window.addEventListener('load', function() {
      setTimeout(() => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`Page load time: ${loadTime}ms`);
      }, 0);
    });
  }
}); 