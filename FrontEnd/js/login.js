const API_BASE_URL = "http://localhost:5678/api";

document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        const res = await fetch(`${API_BASE_URL}/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            alert("Email ou mot de passe incorrect");
            return;
        }

        const data = await res.json();
        console.log("✅ Login réussi :", data);

        // Stocker le token pour les requêtes protégées
        localStorage.setItem("token", data.token);

        // Rediriger vers la page principale
        window.location.href = "index.html";
    } catch (err) {
        console.error("Erreur login:", err);
        alert("Un problème est survenu, réessaie.");
    }
});
