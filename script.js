let currentUser = null;
let weights = JSON.parse(localStorage.getItem('weights')) || {};
let chart = null;

const motivations = [
  "Você é um rockstar da balança! 🎸",
  "Mais leve que uma pluma hoje! 🪶",
  "Arrasou, continue assim! 💪",
  "Peso caindo, astral subindo! 🚀"
];

function login() {
  const username = document.getElementById('username').value.trim();
  if (username) {
    currentUser = username;
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-section').style.display = 'block';
    document.getElementById('user-name').textContent = username;
    document.getElementById('motivation').textContent = motivations[Math.floor(Math.random() * motivations.length)];
    loadWeights();
  }
}

function addWeight() {
  const date = document.getElementById('date').value;
  const weight = parseFloat(document.getElementById('weight').value);
  if (date && weight) {
    if (!weights[currentUser]) weights[currentUser] = [];
    weights[currentUser].push({ date, weight });
    weights[currentUser].sort((a, b) => new Date(a.date) - new Date(b.date));
    localStorage.setItem('weights', JSON.stringify(weights));
    document.getElementById('date').value = '';
    document.getElementById('weight').value = '';
    loadWeights();
  }
}

function loadWeights() {
  const userWeights = weights[currentUser] || [];
  const weightList = document.getElementById('weight-list');
  weightList.innerHTML = '';
  userWeights.forEach(w => {
    const li = document.createElement('li');
    li.textContent = `${w.date}: ${w.weight} kg`;
    weightList.appendChild(li);
  });

  if (chart) chart.destroy();
  const ctx = document.getElementById('pesoChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: userWeights.map(w => w.date),
      datasets: [{
        label: 'Peso (kg)',
        data: userWeights.map(w => w.weight),
        borderColor: '#ff6384',
        fill: false
      }]
    },
    options: { animation: { duration: 2000 } }
  });
}