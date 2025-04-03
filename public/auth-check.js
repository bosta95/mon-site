/**
 * Vérification de l'authentification
 * Ce fichier vérifie si l'utilisateur est authentifié avant d'accéder aux pages protégées
 */

// Fonction pour vérifier si l'utilisateur est authentifié
function checkAuth() {
    // Vérifier si l'utilisateur est connecté
    const isAuthenticated = localStorage.getItem('authToken') !== null;
    
    // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
    if (!isAuthenticated) {
        window.location.href = 'espace-client-login.html';
        return false;
    }
    
    return true;
}

// Fonction pour vérifier si l'utilisateur est admin
function checkAdminAuth() {
    // Vérifier si l'utilisateur est connecté et est admin
    const isAuthenticated = localStorage.getItem('authToken') !== null;
    const isAdmin = localStorage.getItem('userRole') === 'admin';
    
    // Si l'utilisateur n'est pas connecté ou n'est pas admin, rediriger vers la page appropriée
    if (!isAuthenticated) {
        window.location.href = 'admin-login.html';
        return false;
    } else if (!isAdmin) {
        window.location.href = 'espace-client.html';
        return false;
    }
    
    return true;
}

// Vérifier l'authentification au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si la page actuelle est une page protégée
    const isProtectedPage = document.body.classList.contains('protected-page');
    const isAdminPage = document.body.classList.contains('admin-page');
    
    if (isProtectedPage) {
        checkAuth();
    } else if (isAdminPage) {
        checkAdminAuth();
    }
}); 