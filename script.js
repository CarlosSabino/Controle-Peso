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
let weightListener = null;

const motivations = [
  "Você é um rockstar da balança! 🎸",
  "Mais leve que uma pluma hoje! 🪶",
  "Arrasou, continue assim! 💪",
  "Peso caindo, astral subindo! 🚀",
  "Hoje é seu dia de brilhar! ✨",
  "Você está no caminho certo! 🏃‍♂️",
  "Cada passo conta, você é incrível! 🌈"
];

const weightLossMotivations = [
  "Parabéns, você perdeu peso! Continue assim! 🎉",
  "Incrível, mais leve a cada dia! 🥳",
  "Você está arrasando na perda de peso! 💥",
  "Que progresso fantástico! Siga em frente! 🚀"
];

const weightGainMotivations = [
  "Não desanime, cada dia é uma nova chance! 🌟",
  "Você é mais forte do que pensa, continue! 💪",
  "Um pequeno passo para trás, mas você vai longe! 🏃‍♂️",
  "Mantenha o foco, você consegue! 🌈"
];

// Função para pegar a frase do dia
function getDailyMotivation() {
  const today = new Date().toISOString().split('T')[0];
  const index = Math.floor(new Date(today).getTime() / (1000 * 60 * 60 * 24)) % motivations.length;
  return motivations[index];
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

function showMainSection() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('signup-section').style.display = 'none';
  document.getElementById('ranking-section').style.display = 'none';
  setTimeout(() => {
    document.getElementById('main-section').style.display = 'block';
  }, 50);
  document.getElementById('motivation').textContent = getDailyMotivation();
}

function showRanking() {
  document.getElementById('main-section').style.display = 'none';
  setTimeout(() => {
    document.getElementById('ranking-section').style.display = 'block';
    updateWeeklyRanking();
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
  if (weightListener) {
    weightListener.off();
    weightListener = null;
    console.log("Listener de pesos desativado.");
  }
  auth.signOut().then(() => {
    document.getElementById('main-section').style.display = 'none';
    document.getElementById('ranking-section').style.display = 'none';
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
    console.log("Usuário autenticado - UID:", user.uid, "Email:", user.email);
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
    if (weightListener) {
      weightListener.off();
      weightListener = null;
      console.log("Listener de pesos desativado (onAuthStateChanged).");
    }
    document.getElementById('main-section').style.display = 'none';
    document.getElementById('ranking-section').style.display = 'none';
    setTimeout(() => {
      document.getElementById('login-section').style.display = 'block';
    }, 50);
  }
});

function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return Math.round(((d - week1) / 86400000 + 1) / 7);
}

function getWeekRange() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  const year = monday.getFullYear();
  const week = getWeekNumber(monday);
  const weekKey = `${year}-${week}`;

  return { monday, friday, weekKey };
}

function updateWeeklyRanking() {
  const { monday, friday, weekKey } = getWeekRange();
  const rankingList = document.getElementById('ranking-list');
  rankingList.innerHTML = '';

  console.log("Intervalo da semana:", monday, "a", friday);

  database.ref('users').once('value', usersSnapshot => {
    const users = [];
    usersSnapshot.forEach(userSnap => {
      const userData = userSnap.val();
      users.push({ uid: userSnap.key, name: userData.name });
    });

    console.log("Usuários encontrados:", users);

    const promises = users.map(user => {
      return database.ref('weights/' + user.uid).once('value').then(weightsSnapshot => {
        const weights = [];
        weightsSnapshot.forEach(child => {
          const data = child.val();
          const weightDate = new Date(data.date);
          if (weightDate >= monday && weightDate <= friday) {
            weights.push({ date: weightDate, weight: data.weight });
          }
        });

        console.log(`Pesos de ${user.name} na semana:`, weights);

        if (weights.length === 0) return null;

        weights.sort((a, b) => a.date - b.date);

        const firstWeight = weights[0].weight;
        const lastWeight = weights[weights.length - 1].weight;
        const weightLoss = firstWeight - lastWeight;

        console.log(`${user.name} - Primeiro peso: ${firstWeight}, Último peso: ${lastWeight}, Perda: ${weightLoss}`);

        return { uid: user.uid, name: user.name, weightLoss };
      }).catch(error => {
        console.error(`Erro ao ler pesos de ${user.name}:`, error);
        return null; // Ignora usuários com erro de permissão
      });
    });

    Promise.all(promises).then(results => {
      const ranking = results
        .filter(result => result !== null && result.weightLoss > 0)
        .sort((a, b) => b.weightLoss - a.weightLoss);

      console.log("Ranking calculado (apenas perdas positivas):", ranking);

      database.ref('weeklyScores/' + weekKey).set(ranking);

      ranking.forEach((entry, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${entry.name}: ${entry.weightLoss.toFixed(1)} kg`;
        rankingList.appendChild(li);
      });

      if (ranking.length === 0) {
        rankingList.innerHTML = '<li>Nenhum usuário perdeu peso esta semana.</li>';
      }
    });
  });
}

// Adicionar peso
function addWeight() {
  if (!auth.currentUser) {
    console.log("Usuário não autenticado! Redirecionando para login...");
    alert("Sua sessão expirou. Por favor, faça login novamente.");
    signOut();
    return;
  }

  const user = auth.currentUser;
  console.log("Usuário autenticado para adicionar peso - UID:", user.uid, "Email:", user.email);

  const date = document.getElementById('date').value;
  const weight = parseFloat(document.getElementById('weight').value);

  console.log("Tentando adicionar peso - Usuário UID:", user.uid, "Data:", date, "Peso:", weight);

  if (!date) {
    console.log("Data não selecionada!");
    alert("Por favor, selecione uma data.");
    return;
  }
  if (isNaN(weight)) {
    console.log("Peso inválido:", document.getElementById('weight').value);
    alert("Por favor, insira um peso válido.");
    return;
  }

  // Obter o peso anterior para comparação
  database.ref('weights/' + user.uid).once('value', snapshot => {
    const weights = [];
    snapshot.forEach(child => {
      const data = child.val();
      weights.push({ date: data.date, weight: data.weight });
    });

    console.log("Pesos existentes para o usuário:", weights);

    // Salvar o novo peso
    const newWeightRef = database.ref('weights/' + user.uid).push();
    newWeightRef.set({ date, weight })
      .then(() => {
        console.log("Peso adicionado com sucesso no Firebase! ID do novo peso:", newWeightRef.key);
        document.getElementById('date').value = '';
        document.getElementById('weight').value = '';

        // Comparar com o peso anterior
        if (weights.length > 0) {
          weights.sort((a, b) => new Date(b.date) - new Date(a.date));
          const previousWeight = weights[0].weight;
          console.log("Comparando - Peso anterior:", previousWeight, "Novo peso:", weight);
          if (weight < previousWeight) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
            const motivationIndex = Math.floor(Math.random() * weightLossMotivations.length);
            document.getElementById('motivation').textContent = weightLossMotivations[motivationIndex];
          } else {
            const motivationIndex = Math.floor(Math.random() * weightGainMotivations.length);
            document.getElementById('motivation').textContent = weightGainMotivations[motivationIndex];
          }
        } else {
          console.log("Nenhum peso anterior encontrado para comparação.");
        }
      })
      .catch(error => {
        console.error("Erro ao adicionar peso no Firebase:", error);
        alert("Erro ao adicionar peso: " + error.message);
      });
  }).catch(error => {
    console.error("Erro ao ler pesos existentes:", error);
    alert("Erro ao ler pesos existentes: " + error.message);
  });
}

// Carregar pesos
function loadWeights(uid) {
  if (!auth.currentUser) {
    console.log("Usuário não autenticado ao carregar pesos! UID fornecido:", uid);
    return;
  }
  if (uid !== auth.currentUser.uid) {
    console.error("UID fornecido não corresponde ao usuário autenticado! UID fornecido:", uid, "UID autenticado:", auth.currentUser.uid);
    return;
  }

  console.log("Carregando pesos para UID:", uid);
  const weightList = document.getElementById('weight-list');
  weightList.innerHTML = '';
  if (weightListener) {
    weightListener.off();
    console.log("Listener anterior desativado.");
  }
  weightListener = database.ref('weights/' + uid);
  weightListener.on('value', snapshot => {
    const weights = [];
    weightList.innerHTML = '';
    snapshot.forEach(child => {
      const data = child.val();
      const id = child.key;
      weights.push({ id, ...data });
      const li = document.createElement('li');
      li.innerHTML = `${data.date}: ${data.weight} kg 
        <button class="edit-btn" onclick="editWeight('${id}', '${data.date}', ${data.weight})">Editar</button>
        <button class="delete-btn" onclick="deleteWeight('${id}')">Deletar</button>`;
      weightList.appendChild(li);
    });
    updateChart(weights);
  }, error => {
    console.error("Erro ao carregar pesos:", error);
    alert("Erro ao carregar pesos: " + error.message);
  });
}

// Editar peso
function editWeight(id, date, weight) {
  document.getElementById('edit-id').value = id;
  document.getElementById('edit-date').value = date;
  document.getElementById('edit-weight').value = weight;
  document.getElementById('edit-form').style.display = 'block';
}

// Salvar edição
function saveEdit() {
  const user = auth.currentUser;
  if (!user) {
    alert("Por favor, faça login novamente.");
    return;
  }

  const id = document.getElementById('edit-id').value;
  const date = document.getElementById('edit-date').value;
  const weight = parseFloat(document.getElementById('edit-weight').value);

  if (!date) {
    alert("Por favor, selecione uma data.");
    return;
  }
  if (isNaN(weight)) {
    alert("Por favor, insira um peso válido.");
    return;
  }

  database.ref('weights/' + user.uid + '/' + id).set({ date, weight })
    .then(() => {
      console.log("Peso editado com sucesso!");
      document.getElementById('edit-form').style.display = 'none';
    })
    .catch(error => {
      console.error("Erro ao editar peso:", error);
      alert("Erro ao editar peso: " + error.message);
    });
}

// Cancelar edição
function cancelEdit() {
  document.getElementById('edit-form').style.display = 'none';
}

// Deletar peso
function deleteWeight(id) {
  const user = auth.currentUser;
  if (!user) {
    alert("Por favor, faça login novamente.");
    return;
  }

  if (confirm("Tem certeza que deseja deletar este registro?")) {
    database.ref('weights/' + user.uid + '/' + id).remove()
      .then(() => {
        console.log("Peso deletado com sucesso!");
      })
      .catch(error => {
        console.error("Erro ao deletar peso:", error);
        alert("Erro ao deletar peso: " + error.message);
      });
  }
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
