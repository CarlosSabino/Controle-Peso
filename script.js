const firebaseConfig = {
  apiKey: "AIzaSyDu-66630YK500EMO1g7K4M0dZgNSdNm4Q",
  authDomain: "controlepeso-d5897.firebaseapp.com",
  databaseURL: "https://controlepeso-d5897-default-rtdb.firebaseio.com",
  projectId: "controlepeso-d5897",
  storageBucket: "controlepeso-d5897.firebasestorage.app",
  messagingSenderId: "471187898717",
  appId: "1:471187898717:web:7f5adde9afe600355b68b4"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.getAuth(app);
const database = firebase.getDatabase(app);
let chart = null;

const motivations = [
  "Você é um rockstar da balança! 🎸",
  "Mais leve que uma pluma hoje! 🪶",
  "Arrasou, continue assim! 💪",
  "Peso caindo, astral subindo! 🚀"
];

function signUp() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  firebase.createUserWithEmailAndPassword(auth, email, password)
    .then(() => showMainSection())
    .catch(error => alert("Erro ao cadastrar: " + error.message));
}

function signIn() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  firebase.signInWithEmailAndPassword(auth, email, password)
    .then(() => showMainSection())
    .catch(error => alert("Erro ao entrar: " + error.message));
}

function signOut() {
  firebase.signOut(auth).then(() => {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('main-section').style.display = 'none';
    document.getElementById('signout-btn').style.display = 'none';
  });
}

firebase.onAuthStateChanged(auth, user => {
  if (user) {
    showMainSection();
    loadWeights(user.uid);
  } else {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('main-section').style.display = 'none';
  }
});

function showMainSection() {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('main-section').style.display = 'block';
  document.getElementById('signout-btn').style.display = 'inline';
  document.getElementById('motivation').textContent = motivations[Math.floor(Math.random() * motivations.length)];
}

function addWeight() {
  const user = auth.currentUser;
  if (!user) return;
  const date = document.getElementById('date').value;
  const weight = parseFloat(document.getElementById('weight').value);
  if (date && weight) {
    firebase.push(firebase.ref(database, 'weights/' + user.uid), { date, weight })
      .then(() => {
        document.getElementById('date'). value = '';
        document.getElementById('weight').value = '';
      });
  }
}

function loadWeights(uid) {
  const weightList = document.getElementById('weight-list');
  weightList.innerHTML = '';
  firebase.onValue(firebase.ref(database, 'weights/' + uid), snapshot => {
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
