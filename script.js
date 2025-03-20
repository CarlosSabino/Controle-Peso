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
let weightListener = null; // Variável para armazenar o listener

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

// Funções para alternar entre telas com transição
function showSignUp() {
  document.getElementById('login-section').style.display = 'none';
  setTimeout(() => {
    document.getElementById('signup-section').style.display = 'block';
  }, 50);
}

function showLogin() {
  document.getElementById('signup-section').style.display = 'none';
  setTimeout(() => {
    document.getElementById('login-section').style.display = 'block';
  }, 50);
}

// Funções de autenticação
function signUp() {
  const name = document.getElementById('name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  if (!name) {
    alert("Por favor, insira seu nome!");
    return;
  }
  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      console.log("Usuário cadastrado:", user.uid);
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
  // Desativar o listener de pesos antes de fazer logout
  if (weightListener) {
    weightListener.off();
    weightListener = null;
    console.log("Listener de pesos desativado.");
  }
  auth.signOut().then(() => {
    document.getElementById('main-section').style.display = 'none';
    setTimeout(() => {
      document.getElementById('login-section').style.display = 'block';
    }, 50);
  }).catch(error => {
    console.error("Erro ao fazer logout:", error);
    alert("Erro ao fazer logout: " + error.message);
  });
}

// Verifica estado de autenticação
auth.onAuthStateChanged(user => {
  if (user) {
    console.log("Usuário autenticado:", user.uid);
    database.ref('users/' + user.uid).once('value', snapshot => {
      const userData = snapshot.val();
      console.log("Dados do usuário:", userData);
      if (userData) {
        document.getElementById('user-name').textContent = userData.name;
      } else {
        console.warn("Nenhum dado encontrado para o usuário:", user.uid);
        document.getElementById('user-name').textContent = "Usuário";
      }
      showMainSection();
      loadWeights(user.uid);
    }, error => {
      console.error("Erro ao ler dados do usuário:", error);
      alert("Erro ao carregar dados do usuário: " + error.message);
      document.getElementById('user-name').textContent = "Usuário";
      showMainSection();
      loadWeights(user.uid);
    });
  } else {
    console.log("Nenhum usuário autenticado.");
    // Desativar o listener ao deslogar
    if (weightListener) {
      weightListener.off();
      weightListener = null;
      console.log("Listener de pesos desativado (onAuthStateChanged).");
    }
    document.getElementById('main-section').style.display = 'none';
    setTimeout(() => {
      document.getElementById('login-section').style.display = 'block';
    }, 50);
  }
});

function showMainSection() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('signup-section').style.display = 'none';
  setTimeout(() => {
    document.getElementById('main-section').style.display = 'block';
  }, 50);
  document.getElementById('motivation').textContent = getDailyMotivation();
}

// Adicionar peso
function addWeight() {
  const user = auth.currentUser;
  if (!user) {
    console.log("Usuário não autenticado!");
    alert("Por favor, faça login novamente.");
    return;
  }

  const date = document.getElementById('date').value;
  const weight = parseFloat(document.getElementById('weight').value);

  console.log("Data:", date, "Peso:", weight);

  if (!date) {
    alert("Por favor, selecione uma data.");
    return;
  }
  if (isNaN(weight)) {
    alert("Por favor, insira um peso válido.");
    return;
  }

  database.ref('weights/' + user.uid).push({ date, weight })
    .then(() => {
      console.log("Peso adicionado com sucesso!");
      document.getElementById('date').value = '';
      document.getElementById('weight').value = '';
    })
    .catch(error => {
      console.error("Erro ao adicionar peso:", error);
      alert("Erro ao adicionar peso: " + error.message);
    });
}

// Carregar pesos
function loadWeights(uid) {
  const weightList = document.getElementById('weight-list');
  weightList.innerHTML = '';
  // Armazenar a referência do listener
  weightListener = database.ref('weights/' + uid);
  weightListener.on('value', snapshot => {
    const weights = [];
    snapshot.forEach(child => {
      const data = child.val();
      weights.push(data);
      const li = document.createElement('li');
      li.textContent = `${data.date}: ${data.weight} kg`;
      weightList.appendChild(li);
    });
    updateChart(weights);
  }, error => {
    console.error("Erro ao carregar pesos:", error);
    alert("Erro ao carregar pesos: " + error.message);
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

// Função para recuperação de senha
function resetPassword() {
  const email = document.getElementById('email').value;
  if (!email) {
    alert("Por favor, insira seu email para redefinir a senha.");
    return;
  }
  auth.sendPasswordResetEmail(email)
    .then(() => {
      alert("Email de redefinição de senha enviado! Verifique sua caixa de entrada (e a pasta de spam).");
    })
    .catch(error => {
      console.error("Erro ao enviar email de redefinição:", error);
      alert("Erro ao enviar email de redefinição: " + error.message);
    });
}
