document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = event.target[0].value;
    const password = event.target[1].value;

    // Hash the password for comparison
    const hashedPassword = btoa(password);

    // Retrieve users from local storage
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // Check if user exists
    const user = users.find(user => user.email === email && user.password === hashedPassword);

    if (user) {
        // Store current user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        alert('Connexion réussie !');
        window.location.href = 'espace-client.html';
    } else {
        document.getElementById('error-message').textContent = 'Email ou mot de passe incorrect';
    }
}); 