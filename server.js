const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));

const games = {}; // { roomId: { players: [], started: false, roles: {} } }
const LOCATIONS = [
  "Avião",
  "Parque de diversões",
  "Banco",
  "Praia",
  "Baile de máscaras",
  "Cassino",
  "Circo",
  "Festa da empresa",
  "Exército de cruzados",
  "Day spa",
  "Embaixada",
  "Hospital",
  "Hotel",
  "Base militar",
  "Estúdio de cinema",
  "Casa noturna",
  "Transatlântico",
  "Trem de passageiros",
  "Navio pirata",
  "Estação polar",
  "Delegacia",
  "Restaurante",
  "Escola",
  "Oficina",
  "Estação espacial",
  "Submarino",
  "Supermercado",
  "Teatro",
  "Universidade",
  "Zoológico"
];

const ROLES_BY_LOCATION = {
  "Avião": ["Piloto", "Co-piloto", "Comissário(a)", "Passageiro(a)", "Passageiro(a)", "Passageiro(a)", "Comissário(a)"],
  "Parque de diversões": ["Operador de brinquedo", "Palhaço", "Visitante", "Vendedor de pipoca", "Guarda", "Visitante", "Visitante"],
  "Banco": ["Gerente", "Caixa", "Cliente", "Segurança", "Cliente", "Cliente", "Caixa"],
  "Praia": ["Salva-vidas", "Banhista", "Vendedor ambulante", "Surfista", "Banhista", "Banhista", "Instrutor de mergulho"],
  "Baile de máscaras": ["Convidado", "Segurança", "Músico", "Convidado", "Organizador", "Garçom", "Convidado"],
  "Cassino": ["Funcionário que dar as cartas", "Segurança", "Jogador", "Gerente", "Barman", "Jogador", "Jogador"],
  "Circo": ["Palhaço", "Malabarista", "Espectador", "Acrobata", "Mágico", "Espectador", "Espectador"],
  "Festa da empresa": ["Funcionário", "Funcionário", "Funcionário", "Cônjuge de funcionário", "Cônjuge de funcionário", "Dono da empresa", "Garçom"],
  "Exército de cruzados": ["Cavaleiro", "Arqueiro", "Capelão", "Ferreiro", "Escudeiro", "Recruta", "General"],
  "Day spa": ["Massagista", "Cliente", "Recepcionista", "Esteticista", "Cliente", "Gerente", "Cliente"],
  "Embaixada": ["Embaixador", "Diplomata", "Segurança", "Secretário", "Tradutor", "Convidado", "Motorista oficial"],
  "Hospital": ["Médico", "Enfermeiro", "Paciente", "Paciente", "Recepcionista", "Visitante", "Faxineiro"],
  "Hotel": ["Gerente", "Recepcionista", "Hóspede", "Camareira", "Segurança", "Hóspede", "Hóspede"],
  "Base militar": ["General", "Soldado", "Médico de guerra", "Engenheiro", "Piloto", "Instrutor", "Cozinheiro do quartel"],
  "Estúdio de cinema": ["Diretor", "Ator/Atriz", "Roteirista", "Cinegrafista", "Figurinista", "Maquiador", "Produtor"],
  "Casa noturna": ["DJ", "Segurança", "Garçom", "Cliente", "Gerente", "Barman", "Dançarino(a)"],
  "Transatlântico": ["Capitão", "Marinheiro", "Passageiro", "Passageiro", "Chef", "Músico", "Comissário de bordo"],
  "Trem de passageiros": ["Maquinista", "Passageiro", "Fiscal", "Atendente do vagão", "Segurança", "Passageiro", "Passageiro"],
  "Navio pirata": ["Capitão", "Imediato", "Canhoneiro", "Cozinheiro", "Marinheiro", "Prisioneiro", "Navegador"],
  "Estação polar": ["Cientista", "Explorador", "Médico", "Piloto", "Cozinheiro", "Meteorologista", "Pesquisador de campo"],
  "Delegacia": ["Delegado", "Detetive", "Policial", "Presidiário", "Escrivão", "Inspetor", "Vítima"],
  "Restaurante": ["Chef", "Garçom", "Cliente", "Gerente", "Auxiliar de cozinha", "Sommelier", "Limpador de pratos"],
  "Escola": ["Professor", "Diretor", "Aluno", "Aluno", "Aluno", "Secretária", "Bibliotecário"],
  "Oficina": ["Mecânico", "Cliente", "Gerente", "Estagiário", "Eletricista", "Pintor", "Atendente"],
  "Estação espacial": ["Comandante", "Engenheiro", "Cientista", "Piloto", "Médico", "Operador de comunicação", "Botânico"],
  "Submarino": ["Capitão", "Operador de sonar", "Engenheiro naval", "Torpedista", "Oficial de comunicações", "Cozinheiro", "Mergulhador"],
  "Supermercado": ["Caixa", "Gerente", "Cliente", "Repositor", "Segurança", "Promotor de vendas", "Estoquista"],
  "Teatro": ["Ator/Atriz", "Diretor", "Contra-regra", "Cenógrafo", "Maquiador", "Plateia", "Iluminador"],
  "Universidade": ["Professor", "Aluno", "Bibliotecário", "Reitor", "Zelador", "Pesquisador", "Aluno"],
  "Zoológico": ["Zelador de animais", "Veterinário", "Visitante", "Guia", "Segurança", "Biólogo", "Alimentador de animais"]
};

// const LOCATIONS = [
//   "Avião",
//   "Praia",
//   "Parque de diversões",
//   "Escola",
//   "Supermercado",
//   "Zoológico",
//   "Hospital",
//   "Restaurante",
//   "Parquinho",
//   "Cinema",
//   "Fazenda",
//   "Casa",
//   "Biblioteca"
// ];

// const ROLES_BY_LOCATION = {
//   "Avião": ["Piloto", "Aeromoça/Aeromoço", "Passageiro(a)", "Co-piloto"],
//   "Praia": ["Salva-vidas", "Banhista", "Surfista", "Vendedor de comida"],
//   "Parque de diversões": ["Palhaço", "Operador de brinquedo", "Visitante", "Vendedor de pipoca"],
//   "Escola": ["Professor", "Aluno", "Diretor", "Aluno"],
//   "Supermercado": ["Caixa", "Cliente", "Pessoa da limpeza", "Cliente"],
//   "Zoológico": ["Zelador de animais", "Veterinário", "Visitante", "Guia"],
//   "Hospital": ["Médico", "Enfermeiro", "Paciente", "Visitante"],
//   "Restaurante": ["Chef que prepara a comida", "Garçom", "Cliente", "Cliente"],
//   "Parquinho": ["Criança", "Pai/Mãe", "Criança", "Vendedor de pipoca"],
//   "Cinema": ["Pessoa que vende ingresso", "Cliente", "Vendedor de pipoca", "Cliente"],
//   "Fazenda": ["Fazendeiro", "Criança", "Cavalo", "Vaca/Boi"],
//   "Casa": ["Mamãe", "Papai", "Criança", "Cachorro"],
//   "Biblioteca": ["Pessoa que trabalha na biblioteca", "Leitor", "Criança", "Contador(a) de histórias"]
// };




app.get('/', (req, res) => {
  console.log("Room created!");
  const roomId = uuidv4().slice(0, 6);
  res.redirect(`/${roomId}`);
});

app.get('/:roomId', (req, res) => {
  const { roomId } = req.params;
  if (!games[roomId]) {
    games[roomId] = { players: [], started: false, ready: {}, roles: {}, reshuffleRequests: {} };
  }
  res.render('lobby', { roomId });
});

io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    const game = games[roomId];

    if (!game.players.includes(socket.id)) {
      game.players.push(socket.id);
      game.ready[socket.id] = false;
    }

    io.to(roomId).emit('players-updated', {
      players: game.players,
      ready: game.ready,
    });
  });

  socket.on('player-ready', (roomId) => {
    const game = games[roomId];
    if (game) {
      game.ready[socket.id] = true;

      const allReady = game.players.every(playerId => game.ready[playerId]);
      io.to(roomId).emit('players-updated', {
        players: game.players,
        ready: game.ready,
        allReady
      });
    }
  });

  socket.on('start-game', (roomId) => {
    const game = games[roomId];
    if (game && !game.started) {
      const allReady = game.players.every(playerId => game.ready[playerId]);
      if (!allReady) return; // Bloqueia início se alguém não estiver pronto
      game.started = true;
      const spyIndex = Math.floor(Math.random() * game.players.length);
      const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

      const nonSpies = [...game.players];
      nonSpies.splice(spyIndex, 1);

      const rolesForLocation = ROLES_BY_LOCATION[location] || [];
      const shuffledRoles = rolesForLocation.sort(() => 0.5 - Math.random());

      game.players.forEach((playerId, index) => {
        if (index === spyIndex) {
          game.roles[playerId] = 'spy';
          io.to(playerId).emit('role-assigned', {
            role: 'spy',
            location: null,
          });
        } else {
          const playerRole = shuffledRoles.pop() || location;
          game.roles[playerId] = playerRole;
          io.to(playerId).emit('role-assigned', {
            role: playerRole,
            location,
          });
        }
      });


      io.to(roomId).emit('game-started');
    }
  });

  socket.on('request-reshuffle', (roomId) => {
    const game = games[roomId];
    if (!game || !game.started) return;

    game.reshuffleRequests[socket.id] = true;

    const allAgreed = game.players.every(p => game.reshuffleRequests[p]);
    if (allAgreed) {
      // Realiza novo sorteio
      const spyIndex = Math.floor(Math.random() * game.players.length);
      const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      const nonSpies = [...game.players];
      nonSpies.splice(spyIndex, 1);

      const rolesForLocation = ROLES_BY_LOCATION[location] || [];
      const shuffledRoles = rolesForLocation.sort(() => 0.5 - Math.random());

      game.players.forEach((playerId, index) => {
        if (index === spyIndex) {
          game.roles[playerId] = 'spy';
          io.to(playerId).emit('role-assigned', {
            role: 'spy',
            location: null,
          });
        } else {
          const playerRole = shuffledRoles.pop() || location;
          game.roles[playerId] = playerRole;
          io.to(playerId).emit('role-assigned', {
            role: playerRole,
            location,
          });
        }
      });

      game.reshuffleRequests = {}; // zera novamente
      io.to(roomId).emit('game-started'); // reativa o botão
    }
  });


  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      const game = games[roomId];
      if (game) {
        game.players = game.players.filter(id => id !== socket.id);
        delete game.ready[socket.id];
        io.to(roomId).emit('players-updated', {
          players: game.players,
          ready: game.ready,
        });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
