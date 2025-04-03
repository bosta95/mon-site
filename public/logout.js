/**
 * Script de déconnexion
 * Ce fichier gère la déconnexion des utilisateurs
 */

// Fonction pour se déconnecter
async function handleLogout() {
    try {
        // Utiliser l'API de déconnexion
        const result = await logout();
        
        if (result.success) {
            // Rediriger vers la page d'accueil
            window.location.href = 'index.html';
        } else {
            console.error('Erreur lors de la déconnexion:', result.error);
            
            // Fallback sur l'ancien système
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            localStorage.removeItem('adminLogged');
            localStorage.removeItem('userRole');
            
            // Rediriger vers la page d'accueil
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        
        // Fallback sur l'ancien système
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminLogged');
        localStorage.removeItem('userRole');
        
        // Rediriger vers la page d'accueil
        window.location.href = 'index.html';
    }
}

// Ajouter un gestionnaire d'événements pour le bouton de déconnexion
document.addEventListener('DOMContentLoaded', function() {
    const logoutButtons = document.querySelectorAll('.logout-btn');
    
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            handleLogout();
        });
    });
}); 