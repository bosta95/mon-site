/**
 * Gestionnaire d'authentification
 * Ce fichier gère les interactions avec l'API d'authentification
 */

// Fonction pour vérifier si l'utilisateur est connecté
function isLoggedIn() {
    return localStorage.getItem('authToken') !== null;
}

// Fonction pour vérifier si l'utilisateur est admin
function isAdmin() {
    return localStorage.getItem('userRole') === 'admin';
}

// Fonction pour se connecter
async function login(username, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include' // Important pour les cookies de session
        });

        const data = await response.json();
        
        if (response.ok) {
            // Stocker les informations de l'utilisateur
            localStorage.setItem('authToken', 'true'); // Similaire à l'ancien système
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            localStorage.setItem('userRole', data.user.role);
            
            return { success: true, user: data.user };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

// Fonction pour s'inscrire
async function register(username, email, password) {
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            return { success: true, message: data.message };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.error('Erreur d\'inscription:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

// Fonction pour se déconnecter
async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });

        const data = await response.json();
        
        if (response.ok) {
            // Supprimer les informations de l'utilisateur
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userRole');
            
            return { success: true, message: data.message };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.error('Erreur de déconnexion:', error);
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

// Fonction pour obtenir les informations de l'utilisateur actuel
function getCurrentUser() {
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
}

// Fonction pour rediriger vers la page appropriée selon le rôle
function redirectBasedOnRole() {
    const userRole = localStorage.getItem('userRole');
    
    if (userRole === 'admin') {
        window.location.href = 'admin-dashboard.html';
    } else {
        window.location.href = 'espace-client.html';
    }
} 