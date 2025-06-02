const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const PORT = 3000;

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


app.get('/', (req, res) => {
  const roomId = uuidv4().slice(0, 6);
  res.redirect(`/${roomId}`);
});

app.get('/:roomId', (req, res) => {
  const { roomId } = req.params;
  if (!games[roomId]) {
    games[roomId] = { players: [], started: false, roles: {} };
  }
  res.render('lobby', { roomId });
});

io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    const game = games[roomId];

    if (!game.players.includes(socket.id)) {
      game.players.push(socket.id);
    }

    io.to(roomId).emit('players-updated', {
      players: game.players,
      owner: game.players[0],
    });
  });

  socket.on('start-game', (roomId) => {
    const game = games[roomId];
    if (!game.started) {
      game.started = true;

      // Sorteia espião
      const spyIndex = Math.floor(Math.random() * game.players.length);
      const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

      game.players.forEach((playerId, index) => {
        const role = index === spyIndex ? 'spy' : location;
        game.roles[playerId] = role;

        io.to(playerId).emit('role-assigned', {
          role,
          location: index === spyIndex ? null : location,
        });
      });

      io.to(roomId).emit('game-started');
    }
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (games[roomId]) {
        games[roomId].players = games[roomId].players.filter(id => id !== socket.id);
        io.to(roomId).emit('players-updated', {
          players: games[roomId].players,
          owner: games[roomId].players[0],
        });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
