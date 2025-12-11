const SIZE = 5;             
const GAME_SECONDS = 300;      // Durée du jeu en secondes (5 minutes)


let moves = 0;                 // Nombre de coups effectués
let timer = GAME_SECONDS;      // Temps restant en secondes
let intervalId = null;         
let gameActive = false;      

/* RESSOURCES ET ÉLÉMENTS DOM  */
const imageURL = 'blur.jpg'; // URL de l'image à révéler

// Récupération des éléments DOM
const boardEl = document.getElementById('board');   // Conteneur de la grille
const movesEl = document.getElementById('moves');   // Affichage du nombre de coups
const timerEl = document.getElementById('timer');   // Affichage du timer
const statusEl = document.getElementById('status');  // Affichage du statut
const answerEl = document.getElementById('answer');  // Zone de réponse (si existe)


// Configuration de base de la grille (1 = allumé, 0 = éteint)
let base = [
  [1,0,1,0,1],
  [0,1,0,1,0],
  [1,0,0,0,1],
  [0,1,0,1,0],
  [1,0,1,0,1]
];
// Copie de la grille de base pour le jeu actuel
let grid = base.map(row => row.slice());



/**
 * Formate le temps en secondes au forlightsout_2at MM:SS
 * @param {number} s - Temps en secolightsout_2ndes
 * @returns {string} Temps formaté (ex: "05:00")
 */
function formatTime(s){
  const m = Math.floor(s/60).toString().padStart(2,'0');
  const sec = (s%60).toString().padStart(2,'0');
  return `${m}:${sec}`;
}

/**
 * Met à jour le statut affiché dans l'interface
 * @param {string} t - Texte du statut
 */
function setStatus(t){ statusEl.textContent = t }

/**
 * Vérifie si les coordonnées sont dans les limites de la grille
 * @param {number} r - Ligne
 * @param {number} c - Colonne
 * @returns {boolean} True si les coordonnées sont valides
 */
function inBounds(r,c){ return r>=0 && c>=0 && r<SIZE && c<SIZE }

/**
 * Bascule l'état d'une cellule (allumé/éteint)
 * @param {number} r - Ligne
 * @param {number} c - Colonne
 */
function toggleCell(r,c){ if(!inBounds(r,c)) return; grid[r][c] ^= 1 }


/**
 * Crée le plateau de jeu en générant toutes les tuiles
 */
function createBoard(){
 
  // Réinitialise le DOM du plateau et positionne la grille CSS
  boardEl.innerHTML = ''; 
  boardEl.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;

  // Crée les tuiles (éléments <div>) et attache l'écouteur de clic pour chaque case
  for(let r = 0; r < SIZE; r++){
    for(let c = 0; c < SIZE; c++){
      const el = document.createElement('div');
      el.className = 'tile';
      // Stocke les coordonnées sur l'élément pour y accéder plus tard
      el.dataset.r = r;
      el.dataset.c = c;
      el.addEventListener('click', () => handleClick(r,c));
      boardEl.appendChild(el);
    }
  }

  // Met à jour l'affichage visuel des tuiles en fonction de `grid`
  refreshVisuals();
}

/**
 * Gère le clic sur une tuile
 * @param {number} r - Ligne de la tuile cliquée
 * @param {number} c - Colonne de la tuile cliquée
 */


function handleClick(r,c){
  // Ne rien faire si le jeu n'est pas actif ou si le temps est écoulé
  if(!gameActive || timer <= 0) return;


  // Action Lights Out : bascule la case cliquée et ses 4 voisins
  toggleCell(r,c);      // Case cliquée
  toggleCell(r-1,c);    // Voisin du haut
  toggleCell(r+1,c);    // Voisin du bas
  toggleCell(r,c-1);    // Voisin de gauche
  toggleCell(r,c+1);    // Voisin de droite

  // Compteur de coups
  moves++;
  if(movesEl) movesEl.textContent = moves;

  // Rafraîchit l'affichage et vérifie la victoire
  refreshVisuals();
  checkWin();
}


/**
 * Met à jour l'affichage visuel de toutes les tuiles
 */
function refreshVisuals(){
  // Met à jour visuellement chaque tuile en fonction de la valeur dans `grid`.
  // Les tuiles à 1 montrent une portion de l'image, les tuiles à 0 sont "éteintes".
  const tiles = boardEl.children;
  for(let i = 0; i < tiles.length; i++){
    const el = tiles[i];
    const r = +el.dataset.r, c = +el.dataset.c;

    // Vérification de sécurité pour éviter les erreurs
    if(!inBounds(r, c) || !grid[r] || grid[r][c] === undefined) continue;

    if(grid[r][c]){
      // Case allumée : montre la portion d'image correspondante
      el.classList.remove('off');
      el.classList.add('on');
      // Calcule la position de la portion d'image dans l'image complète
      const px = (c / (SIZE - 1)) * 100;
      const py = (r / (SIZE - 1)) * 100;
      el.style.backgroundImage = `url(${imageURL})`;
      el.style.backgroundPosition = `${px}% ${py}%`;
      el.style.backgroundSize = `${SIZE*100}% ${SIZE*100}%`;
      el.innerHTML = '';
    } else {
      // Case éteinte : fond sombre
      el.classList.remove('on');
      el.classList.add('off');
      el.style.backgroundImage = '';
      el.style.backgroundColor = '#111';
      el.innerHTML = '';
    }
  }
}


/**
 * Réinitialise le jeu à son état de départ
 */
function reset(){
  // Remet la grille à la configuration de départ et remet le compteur à zéro
  grid = base.map(row => row.slice());
  moves = 0;
  if(movesEl) movesEl.textContent = moves;
  // Restaure la grille si elle a été remplacée par l'image complète
  boardEl.classList.remove('solved', 'full-image');
  boardEl.style.backgroundImage = '';
  boardEl.style.backgroundSize = '';
  boardEl.style.backgroundPosition = '';
  boardEl.style.backgroundRepeat = '';
  boardEl.style.aspectRatio = '';
  boardEl.style.minHeight = '';
  createBoard();
}

/**
 * Remplace la grille par l'image complète une fois le puzzle résolu
 */
function showFullImage(){
  // Remplace la grille par l'image complète
  boardEl.innerHTML = '';
  boardEl.classList.add('solved', 'full-image');
  boardEl.style.backgroundImage = `url('no_blur.jpg')`;
  boardEl.style.backgroundSize = 'contain'; // Affiche l'image entière sans la couper
  boardEl.style.backgroundPosition = 'center';
  boardEl.style.backgroundRepeat = 'no-repeat';
  boardEl.style.width = '100%';
  // Conserve le même aspect ratio que la grille (carré)
  boardEl.style.aspectRatio = '1/1';
}



/**
 * Vérifie si toutes les cases sont allumées (victoire)
 */
function checkWin(){
  // Ne pas vérifier si le jeu n'est pas actif
  if(!gameActive) return;
  
  // Vérifie si toutes les cellules valent 1 => victoire
  const allOn = grid.every(row => row.every(cell => cell === 1));
  if(allOn){
    setStatus('Gagné !');
    stopTimer();
    gameActive = false;
    
    // Affiche le message de réussite
    const successMsg = document.getElementById('successMessage');
    if(successMsg) successMsg.style.display = 'block';
    
    // Affiche l'overlay de victoire avec le message de félicitations
    const overlay = document.getElementById('winOverlay');
    if(overlay) overlay.style.display = 'flex';
    
    // Remplace la grille par l'image complète après un court délai pour l'effet
    setTimeout(() => {
      showFullImage();
    }, 500);
  }
}


/**
 * Démarre ou redémarre le chronomètre
 */
function startTimer(){
  // Arrête le timer précédent s'il existe
  stopTimer();
  timer = GAME_SECONDS;
  if(timerEl) timerEl.textContent = formatTime(timer);
  
  // Met à jour le timer toutes les secondes
  intervalId = setInterval(() => {
    timer--;
    if(timerEl) timerEl.textContent = formatTime(timer);
    
    // Si le temps est écoulé, arrête le jeu
    if(timer <= 0){
      stopTimer();
      gameActive = false;
      if(statusEl) setStatus('Temps écoulé');
      alert('Temps écoulé — partie terminée.');
    }
  }, 1000);
}



function stopTimer(){
  // Arrête le timer si en cours
  if(intervalId) clearInterval(intervalId);
  intervalId = null;
}



// Gestion du bouton "Commencer"
document.getElementById('startGame').addEventListener('click', () => {
  // Cache les overlays de victoire
  const overlay = document.getElementById('winOverlay');
  if(overlay) overlay.style.display = 'none';
  const successMsg = document.getElementById('successMessage');
  if(successMsg) successMsg.style.display = 'none';
  
  // Réinitialise l'état du jeu et démarre
  reset();
  gameActive = true;
  setStatus('En cours');
  startTimer();
});

// Gestion du bouton "Mélanger" 
document.getElementById('shuffle').addEventListener('click', () => {
  if(!gameActive) return;
  reset();
});



// Initialise le jeu quand le DOM est prêt
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', () => {
    createBoard();
    refreshVisuals();
    setStatus('En attente');
  });
} else {
  // Si le DOM est déjà chargé, initialise directement
  createBoard();
  refreshVisuals();
  setStatus('En attente');
}
