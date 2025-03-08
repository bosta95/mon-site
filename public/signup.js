document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const name = event.target[0].value;
    const email = event.target[1].value;
    const password = event.target[2].value;

    // Hash the password for security
    const hashedPassword = btoa(password); // Simple base64 encoding for demonstration

    // Create a user object
    const user = {
        name: name,
        email: email,
        password: hashedPassword
    };

    // Simulate storing the user in a JSON file
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));

    alert('Compte créé avec succès !');
    window.location.href = 'login.html';
}); 