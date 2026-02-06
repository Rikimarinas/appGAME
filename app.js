const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const challengeEl = document.getElementById("challenge");
const playBtn = document.getElementById("play");
const bonusBtn = document.getElementById("bonus");
const resetBtn = document.getElementById("reset");

let score = 0;
let streak = 0;

const challenges = [
  "Desliza para esquivar",
  "Toca rápido para cargar energía",
  "Mantén pulsado para escudo",
  "Toca dos veces para salto doble",
];

const updateUI = () => {
  scoreEl.textContent = score;
  statusEl.textContent = streak > 0 ? `Racha x${streak}` : "Listo para jugar";
};

playBtn.addEventListener("click", () => {
  streak += 1;
  score += 10;
  const next = challenges[Math.floor(Math.random() * challenges.length)];
  challengeEl.textContent = next;
  updateUI();
});

bonusBtn.addEventListener("click", () => {
  score += 5;
  streak = Math.max(1, streak);
  challengeEl.textContent = "Bonus activado ⚡";
  updateUI();
});

resetBtn.addEventListener("click", () => {
  score = 0;
  streak = 0;
  challengeEl.textContent = "Toca “Jugar” para empezar";
  updateUI();
});

updateUI();
