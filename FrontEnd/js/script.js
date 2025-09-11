const API_BASE_URL = "http://localhost:5678/api";
let worksCache = [];
let categoriesCache = [];

/* =========================
   API calls
========================= */
async function getWorks() {
    const res = await fetch(`${API_BASE_URL}/works`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
}

async function getCategories() {
    const res = await fetch(`${API_BASE_URL}/categories`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
}

async function deleteWork(id, token) {
    const res = await fetch(`${API_BASE_URL}/works/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
}

async function addWork(formData, token) {
    const res = await fetch(`${API_BASE_URL}/works`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
}

/* =========================
   Rendu galerie
========================= */
function renderGallery(works) {
    const gallery = document.querySelector(".gallery");
    if (!gallery) return;
    gallery.innerHTML = "";
    works.forEach((w) => {
        const fig = document.createElement("figure");
        const img = document.createElement("img");
        img.src = w.imageUrl;
        img.alt = w.title;
        img.loading = "lazy";
        const cap = document.createElement("figcaption");
        cap.textContent = w.title;
        fig.append(img, cap);
        gallery.append(fig);
    });
}

/* =========================
   Filtres dynamiques
========================= */
function renderFilters(categories, works) {
    const filtersDiv = document.getElementById("filters");
    if (!filtersDiv) return;
    filtersDiv.innerHTML = "";

    const btnAll = document.createElement("button");
    btnAll.textContent = "Tous";
    btnAll.classList.add("active");
    btnAll.addEventListener("click", () => {
        setActive(btnAll);
        renderGallery(works);
    });
    filtersDiv.append(btnAll);

    categories.forEach((cat) => {
        const btn = document.createElement("button");
        btn.textContent = cat.name;
        btn.addEventListener("click", () => {
            setActive(btn);
            const filtered = works.filter((w) => w.categoryId === cat.id);
            renderGallery(filtered);
        });
        filtersDiv.append(btn);
    });

    function setActive(button) {
        filtersDiv.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
        button.classList.add("active");
    }
}

/* =========================
   UI Auth
========================= */
function setupAuthUi() {
    const token = localStorage.getItem("token");
    let authLink = document.getElementById("nav-auth");
    if (!authLink) return;

    const fresh = authLink.cloneNode(true);
    authLink.parentNode.replaceChild(fresh, authLink);
    authLink = fresh;

    const filtersDiv = document.getElementById("filters");
    const h2 = document.querySelector("#portfolio h2");

    if (token) {
        injectEditBanner();
        authLink.textContent = "logout";
        authLink.href = "#";
        authLink.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("token");
            window.location.href = "index.html";
        });
        if (filtersDiv) filtersDiv.style.display = "none";
        injectEditButton(h2);
    } else {
        authLink.textContent = "login";
        authLink.href = "login.html";
        if (filtersDiv) filtersDiv.style.display = "";
    }
}

function injectEditBanner() {
    if (document.querySelector(".edit-banner")) return;

    const banner = document.createElement("div");
    banner.className = "edit-banner";
    banner.innerHTML = `<i class="fa-regular fa-pen-to-square"></i>
    <span>Mode édition</span>`;
    document.body.prepend(banner);
    document.body.classList.add("has-edit-banner");
}

function injectEditButton(h2) {
    if (!h2 || document.querySelector(".btn-edit")) return;
    const btn = document.createElement("button");
    btn.innerHTML = `<i class="fa-regular fa-pen-to-square" aria-hidden="true"></i> Modifier`;
    btn.className = "btn-edit";
    btn.style.marginLeft = "1rem";
    h2.appendChild(btn);
    btn.addEventListener("click", openModal);
}

/* =========================
   Modale (contenu + suppression)
========================= */
function renderModalGrid(list) {
    const grid = document.getElementById("modal-grid");
    if (!grid) return;
    grid.innerHTML = "";

    list.forEach((w) => {
        const card = document.createElement("div");
        card.className = "modal-item";
        card.dataset.id = w.id;

        const img = new Image();
        img.src = w.imageUrl;
        img.alt = w.title || "Projet";
        img.loading = "lazy";

        const trash = document.createElement("button");
        trash.className = "modal-trash";
        trash.title = "Supprimer";
        trash.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M9 3h6a1 1 0 0 1 1 1v2h4v2h-1v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8H4V6h4V4a1 1 0 0 1 1-1Zm1 3h4V5h-4v1Zm-2 3v10h8V9H8Z"/>
      </svg>`;
        trash.addEventListener("click", () => onDeleteWork(w.id));

        card.append(img, trash);
        grid.append(card);
    });
}

async function onDeleteWork(id) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Vous devez être connecté pour supprimer une photo.");
        return;
    }
    if (!confirm("Supprimer cette photo ?")) return;

    try {
        await deleteWork(id, token);
        worksCache = worksCache.filter((w) => w.id !== id);
        renderModalGrid(worksCache);
        renderGallery(worksCache);
    } catch (e) {
        console.error("Suppression échouée :", e);
        alert("Échec de la suppression (" + e.message + ")");
    }
}

/* =========================
   Modale : ouverture / fermeture accessibles
========================= */
let lastFocused = null;
const modalEl = document.getElementById("gallery-modal");
const closeBtn = modalEl?.querySelector(".close");

function openModal() {
    if (!modalEl) return;
    showListView();

    lastFocused = document.activeElement;
    modalEl.classList.add("open");
    modalEl.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    (closeBtn || modalEl).focus();

    if (!worksCache.length) {
        getWorks().then(ws => { worksCache = ws; renderModalGrid(worksCache); })
            .catch(console.error);
    } else {
        renderModalGrid(worksCache);
    }
}

function closeModal() {
    if (!modalEl) return;
    showListView();

    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    modalEl.classList.remove("open");
    modalEl.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

modalEl?.addEventListener("click", (e) => {
    const isOverlay = e.target.hasAttribute("data-close");
    const closeAncestor = e.target.closest("[data-close]");
    if (isOverlay || closeAncestor) { e.preventDefault(); closeModal(); }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalEl?.classList.contains("open")) {
        e.preventDefault(); closeModal();
    }
});

/* =========================
   Upload
========================= */
const viewList = document.getElementById("modal-view-list");
const viewUpload = document.getElementById("modal-view-upload");
const btnOpenUpload = document.getElementById("btn-open-upload");
const btnBack = document.getElementById("btn-back");
const formUpload = document.getElementById("form-upload");
const inputFile = document.getElementById("file");
const btnChooseFile = document.getElementById("btn-choose-file");
const preview = document.getElementById("preview");
const inputTitle = document.getElementById("title");
const selectCategory = document.getElementById("category");
const btnSubmit = document.getElementById("btn-submit");
const dropZone = document.getElementById("drop-zone");

function showUploadView() {
    if (selectCategory && !selectCategory.dataset.ready) {
        categoriesCache.forEach((c) => {
            const opt = document.createElement("option");
            opt.value = String(c.id);
            opt.textContent = c.name;
            selectCategory.append(opt);
        });
        selectCategory.dataset.ready = "1";
    }
    viewList?.classList.add("hidden");
    viewUpload?.classList.remove("hidden");
}
function showListView() {
    viewUpload?.classList.add("hidden");
    viewList?.classList.remove("hidden");
    clearUploadForm();
}

btnOpenUpload?.addEventListener("click", showUploadView);
btnBack?.addEventListener("click", showListView);

btnChooseFile?.addEventListener("click", () => inputFile?.click());
inputFile?.addEventListener("change", onFileChange);

function onFileChange() {
    const file = inputFile.files?.[0];
    if (!file) return;

    const okType = /^image\/(jpe?g|png)$/i.test(file.type);
    const okSize = file.size <= 4 * 1024 * 1024;

    if (!okType) { alert("Formats autorisés : JPG/PNG."); inputFile.value = ""; return; }
    if (!okSize) { alert("Taille max : 4 Mo."); inputFile.value = ""; return; }

    preview.src = URL.createObjectURL(file);
    preview.classList.remove("hidden");
    dropZone?.classList.add("has-preview");
    validateUploadForm();
}


["dragenter", "dragover"].forEach((evt) =>
    dropZone?.addEventListener(evt, (e) => {
        e.preventDefault();
        dropZone.classList.add("drag");
    })
);
["dragleave", "drop"].forEach((evt) =>
    dropZone?.addEventListener(evt, (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag");
    })
);
dropZone?.addEventListener("drop", (e) => {
    const file = [...e.dataTransfer.files].find((f) => f.type.startsWith("image/"));
    if (file) {
        const dt = new DataTransfer();
        dt.items.add(file);
        inputFile.files = dt.files;
        onFileChange();
    }
});

formUpload?.addEventListener("input", validateUploadForm);
function validateUploadForm() {
    const ok = inputFile.files?.length && inputTitle.value.trim() && selectCategory.value;
    if (btnSubmit) btnSubmit.disabled = !ok;
}

formUpload?.addEventListener("submit", onSubmitUpload);
async function onSubmitUpload(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) { alert("Connectez-vous pour ajouter une photo.."); return; }

    try {
        const fd = new FormData();
        fd.append("image", inputFile.files[0]);
        fd.append("title", inputTitle.value.trim());
        fd.append("category", selectCategory.value);

        const created = await addWork(fd, token);
        worksCache.push(created);
        renderModalGrid(worksCache);
        renderGallery(worksCache);
        showListView();
    } catch (err) {
        alert("Échec de l'ajout (" + err.message + ")");
    }
}

function clearUploadForm() {
    if (preview && preview.src.startsWith("blob:")) {
        URL.revokeObjectURL(preview.src);
    }
    formUpload?.reset();
    preview?.classList.add("hidden");
    dropZone?.classList.remove("has-preview");
    if (preview) preview.src = "";
    if (btnSubmit) btnSubmit.disabled = true;
}

/* =========================
   Init
========================= */
async function init() {
    setupAuthUi();

    try {
        const [works, categories] = await Promise.all([getWorks(), getCategories()]);
        worksCache = works;
        categoriesCache = categories;
        renderFilters(categories, works);
        renderGallery(works);
    } catch (e) {
        console.error("Erreur init:", e);
    }
}

document.addEventListener("DOMContentLoaded", init);
