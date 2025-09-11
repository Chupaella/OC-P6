const API_BASE_URL = "http://localhost:5678/api";

document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorEl = document.getElementById("login-error");
    errorEl.classList.add("hidden"); // reset

    try {
        const res = await fetch(`${API_BASE_URL}/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            errorEl.textContent = "Email ou mot de passe incorrect";
            errorEl.classList.remove("hidden");
            return;
        }

        const data = await res.json();
        localStorage.setItem("token", data.token);
        window.location.href = "index.html";
    } catch (err) {
        errorEl.textContent = "Un problème est survenu, réessaie.";
        errorEl.classList.remove("hidden");
    }
});
