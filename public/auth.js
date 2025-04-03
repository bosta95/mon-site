/**
 * Gestionnaire d'authentification
 * Ce fichier gère les interactions avec l'API d'authentification
 */

// Fonction pour vérifier si l'utilisateur est connecté
async function isLoggedIn() {
    try {
        const response = await fetch('/api/auth/check', {
            credentials: 'include'
        });
        return response.ok;
    } catch (error) {
        console.error('Erreur de vérification de connexion:', error);
        return false;
    }
}

// Fonction pour vérifier si l'utilisateur est admin
async function isAdmin() {
    try {
        const response = await fetch('/api/auth/check-role', {
            credentials: 'include'
        });
        const data = await response.json();
        return data.role === 'admin';
    } catch (error) {
        console.error('Erreur de vérification du rôle:', error);
        return false;
    }
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
            credentials: 'include'
        });

        const data = await response.json();
        
        if (response.ok) {
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
            body: JSON.stringify({ username, email, password }),
            credentials: 'include'
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
async function getCurrentUser() {
    try {
        const response = await fetch('/api/auth/current-user', {
            credentials: 'include'
        });
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Erreur de récupération des informations utilisateur:', error);
        return null;
    }
}

// Fonction pour rediriger vers la page appropriée selon le rôle
async function redirectBasedOnRole() {
    const isUserAdmin = await isAdmin();
    
    if (isUserAdmin) {
        window.location.href = 'admin-dashboard.html';
    } else {
        window.location.href = 'espace-client.html';
    }
} 