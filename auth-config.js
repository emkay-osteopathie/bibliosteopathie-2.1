/*
 * auth-config.js — BibliOstéo IEOQ
 * ---------------------------------------------------------------
 * Verrou d'accès basique côté navigateur, par année d'étude.
 *
 * ⚠️ IMPORTANT : le site étant hébergé en statique (sans serveur),
 * ce verrou n'est PAS une vraie sécurité — n'importe qui sachant
 * afficher le code source de la page peut voir les mots de passe
 * ci-dessous. Il sert seulement à éviter que des visiteurs au
 * hasard tombent sur le contenu, pas à protéger des données
 * sensibles.
 *
 * ACCÈS CUMULATIF : un élève de 2e année a accès au contenu de
 * l'Année 1 ET de l'Année 2 (pas seulement la sienne). Un élève
 * de 1ère année n'a PAS accès au contenu des années supérieures.
 * Concrètement : l'accès à une page "Année X" est autorisé si
 * X <= année de l'élève connecté.
 *
 * Pour changer un identifiant ou un mot de passe : modifie
 * simplement les valeurs ci-dessous, rien d'autre à toucher.
 *
 * Pour ajouter une nouvelle année : ajoute une ligne suivant le
 * même modèle, puis crée le fichier "an5.html" (etc.) avec en tête
 * les deux lignes :
 *   <script src="auth-config.js"></script>
 *   <script>osteoGuardPage(5);</script>
 * (voir an1.html pour un exemple), et ajoute une carte dans
 * home.html pour qu'elle apparaisse dans le choix de contenu.
 */

const OSTEO_AUTH_CONFIG = {
  "eleve.an1": { password: "Osteo-An1-2026", year: 1, label: "Année 1" },
  "eleve.an2": { password: "Osteo-An2-2026", year: 2, label: "Année 2" },
  "eleve.an3": { password: "Osteo-An3-2026", year: 3, label: "Année 3" },
  "eleve.an4": { password: "Osteo-An4-2026", year: 4, label: "Année 4" }
};

const OSTEO_SESSION_KEY = "osteoAuth";
// Après connexion, tout le monde arrive sur la page de choix du contenu.
const OSTEO_POST_LOGIN_PAGE = "home.html";

// Préfixe relatif vers la racine du site, déduit de la façon dont CETTE
// page a chargé auth-config.js (ex. "auth-config.js" à la racine → "",
// "../auth-config.js" depuis an1/ ou an2/ → "../"). Indispensable
// depuis que le contenu des années est réparti dans des sous-dossiers :
// sans ça, une redirection vers "index.html" écrite en dur atterrissait
// sur an1/index.html ou an2/index.html (le hub de catégories) au lieu
// de la vraie page de connexion à la racine.
const OSTEO_ROOT_PREFIX = (function () {
  const s = document.currentScript;
  if (s) {
    const src = s.getAttribute("src") || "";
    const idx = src.lastIndexOf("auth-config.js");
    if (idx !== -1) return src.slice(0, idx);
  }
  return "";
})();

// Vérifie un couple utilisateur/mot de passe. Retourne l'entrée
// correspondante (avec year/label) si valide, sinon null.
function osteoCheckLogin(username, password) {
  const key = (username || "").trim().toLowerCase();
  const entry = OSTEO_AUTH_CONFIG[key];
  if (!entry || entry.password !== password) return null;
  return entry;
}

// Enregistre la session (durée : le temps de l'onglet ouvert).
function osteoSetSession(entry) {
  try {
    sessionStorage.setItem(
      OSTEO_SESSION_KEY,
      JSON.stringify({ year: entry.year, label: entry.label, ts: Date.now() })
    );
  } catch (e) {
    /* stockage indisponible (mode privé strict, etc.) — tant pis, pas bloquant */
  }
}

// Retourne les infos de session en cours ({year, label, ts}) ou null
// si personne n'est connecté / session invalide.
function osteoGetSession() {
  try {
    const raw = sessionStorage.getItem(OSTEO_SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data.year !== "number") return null;
    return data;
  } catch (e) {
    return null;
  }
}

// À appeler tout en haut du <head> de chaque page de contenu
// protégée, avec le numéro d'année requis pour CETTE page.
// Accès cumulatif : autorisé si requiredYear <= année de l'élève.
// Redirige vers l'accueil si la session est absente ou insuffisante.
function osteoGuardPage(requiredYear) {
  const data = osteoGetSession();
  if (!data || requiredYear > data.year) {
    window.location.replace(OSTEO_ROOT_PREFIX + "index.html");
  }
}

// À appeler tout en haut du <head> d'une page qui doit juste
// vérifier qu'un élève est connecté (peu importe son année),
// comme la page de choix du contenu (home.html).
function osteoRequireLogin() {
  if (!osteoGetSession()) {
    window.location.replace(OSTEO_ROOT_PREFIX + "index.html");
  }
}

// Déconnexion (utilisée par le bouton "Se déconnecter").
function osteoLogout() {
  try {
    sessionStorage.removeItem(OSTEO_SESSION_KEY);
  } catch (e) {}
  window.location.href = OSTEO_ROOT_PREFIX + "index.html";
}
