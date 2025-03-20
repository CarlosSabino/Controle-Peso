// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDu-66630YK500EMO1g7K4M0dZgNSdNm4Q",
  authDomain: "controlepeso-d5897.firebaseapp.com",
  databaseURL: "https://controlepeso-d5897-default-rtdb.firebaseio.com",
  projectId: "controlepeso-d5897",
  storageBucket: "controlepeso-d5897.firebasestorage.app",
  messagingSenderId: "471187898717",
  appId: "1:471187898717:web:7f5adde9afe600355b68b4"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
let chart = null;

const motivations = [
  "Você é um rockstar da balança! 🎸",
  "Mais leve que uma pluma hoje! 🪶",
  "Arrasou, continue assim! 💪",
  "Peso caindo, astral subindo! 🚀",
  "Hoje é seu dia de brilhar! ✨",
  "Você está no caminho certo! 🏃‍♂️",
  "Cada passo conta, você é incrível! 🌈"
];

// Função para pegar a frase do dia
function getDailyMotivation() {
  const today = new Date().toISOString().split('T')[0];
  const index = Math.floor(new Date(today).getTime() / (1000 * 60 * 60 * 24)) % motivations.length;
  return motivations[index];
}

// Funções de autenticação
function signUp() {
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if (!name) {
    alert("Por favor, insira seu nome!");
    return;
  }
  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      // Salvar o nome no banco de dados
      database.ref('users/' + user.uid).set({
        name: name,
        email: email
      }).then(() => showMainSection());
    })
    .catch(error => alert("Erro ao cadastrar: " + error.message));
}

function signIn() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => showMainSection())
    .catch(error => alert("Erro ao entrar: " + error.message));
}

function signOut() {
  auth.signOut().then(() => {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('main-section').style.display = 'none';
  });
}

// Verifica estado de autenticação
auth.onAuthStateChanged(user => {
  if (user) {
    // Carregar o nome do usuário
    database.ref('users/' + user.uid).once('value', snapshot => {
      const userData = snapshot.val();
      if (userData) {
        document.getElementById('user-name').textContent = userData.name;
      }
      showMainSection();
      loadWeights(user.uid);
    });
  } else {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('main-section').style.display = 'none';
  }
});

function showMainSection() {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('main-section').style.display = 'block';
  document.getElementById('motivation').textContent = getDailyMotivation();
}

// Adicionar peso
function addWeight() {
  const user = auth.currentUser;
  if (!user) return;
  const date = document.getElementById('date').value;
  const weight = parseFloat(document.getElementById('weight').value);
  if (date && weight) {
    database.ref('weights/' + user.uid).push({ date, weight })
      .then(() => {
        document.getElementById('date').value = '';
        document.getElementById('weight').value = '';
      });
  }
}

// Carregar pesos
function loadWeights(uid) {
  const weightList = document.getElementById('weight-list');
  weightList.innerHTML = '';
  database.ref('weights/' + uid).on('value', snapshot => {
    const weights = [];
    snapshot.forEach(child => {
      const data = child.val();
      weights.push(data);
      const li = document.createElement('li');
      li.textContent = `${data.date}: ${data.weight} kg`;
      weightList.appendChild(li);
    });
    updateChart(weights);
  });
}

// Atualizar gráfico
function updateChart(weights) {
  if (chart) chart.destroy();
  const ctx = document.getElementById('pesoChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: weights.map(w => w.date),
      datasets: [{
        label: 'Peso (kg)',
        data: weights.map(w => w.weight),
        borderColor: '#ff6384',
        fill: false
      }]
    },
    options: { animation: { duration: 2000 } }
  });
}
