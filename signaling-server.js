const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const server = http.createServer(app);


app.use(cors());
app.use(bodyParser.json());

// stockage rooms
const rooms = {};

// on liste les salles
app.get('/rooms', (req, res) => {
  res.json({
    status: 'success',
    rooms: Object.keys(rooms).map(code => ({
      code,
      hasOffer: !!rooms[code].offer,
      hasAnswer: !!rooms[code].answer,
      created: rooms[code].created
    }))
  });
});

// creation salle
app.post('/room', (req, res) => {
  let code = req.body.code;
  
  // generation code si pas de code (inutile, car j'ai fait des betises et un peu la flemme de modifier mais je le garde la)
  if (!code) {
    code = generateRoomCode();
    
    while (rooms[code]) {
      code = generateRoomCode();
    }
  } else if (rooms[code]) {
    
    return res.status(400).json({
      status: 'error',
      message: 'Room already exists'
    });
  }
  
  rooms[code] = {
    offer: null,
    answer: null,
    iceCandidates: [],
    answerCandidates: [],
    created: new Date().toISOString()
  };
  
  // Nettoyage des rooms vides ou trop anciennes
  cleanupOldRooms();
  
  res.json({
    status: 'success',
    code
  });
});

// Offre RTC
app.post('/room/:code/offer', (req, res) => {
  const { code } = req.params;
  const { offer } = req.body;
  
  if (!rooms[code]) {
    return res.status(404).json({
      status: 'error',
      message: 'Room not found'
    });
  }
  
  rooms[code].offer = offer;
  
  res.json({
    status: 'success'
  });
});

// Assoc. Offre - Room
app.get('/room/:code/offer', (req, res) => {
  const { code } = req.params;
  
  if (!rooms[code] || !rooms[code].offer) {
    return res.status(404).json({
      status: 'error',
      message: 'Offer not found'
    });
  }
  
  res.json({
    status: 'success',
    offer: rooms[code].offer
  });
});

// Reponse RTC
app.post('/room/:code/answer', (req, res) => {
  const { code } = req.params;
  const { answer } = req.body;
  
  if (!rooms[code]) {
    return res.status(404).json({
      status: 'error',
      message: 'Room not found'
    });
  }
  
  rooms[code].answer = answer;
  
  res.json({
    status: 'success'
  });
});

// Assoc. Reponse - Room
app.get('/room/:code/answer', (req, res) => {
  const { code } = req.params;
  
  if (!rooms[code] || !rooms[code].answer) {
    return res.status(404).json({
      status: 'error',
      message: 'Answer not found'
    });
  }
  
  res.json({
    status: 'success',
    answer: rooms[code].answer
  });
});

// Nos favoris ces ICE, merci google
app.post('/room/:code/iceCandidate', (req, res) => {
  const { code } = req.params;
  const { candidate, type } = req.body;
  
  if (!rooms[code]) {
    return res.status(404).json({
      status: 'error',
      message: 'Room not found'
    });
  }
  
  if (type === 'offer') {
    rooms[code].iceCandidates.push(candidate);
  } else if (type === 'answer') {
    rooms[code].answerCandidates.push(candidate);
  }
  
  res.json({
    status: 'success'
  });
});

app.get('/room/:code/iceCandidates/:type', (req, res) => {
  const { code, type } = req.params;
  
  if (!rooms[code]) {
    return res.status(404).json({
      status: 'error',
      message: 'Room not found'
    });
  }
  
  const candidates = type === 'offer' ? 
    rooms[code].iceCandidates : 
    rooms[code].answerCandidates;
  
  res.json({
    status: 'success',
    candidates
  });
});

// Creer un code
function generateRoomCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function cleanupOldRooms() {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);
  
  Object.keys(rooms).forEach(code => {
    if (new Date(rooms[code].created) < oneHourAgo) {
      delete rooms[code];
    }
  });
}


app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
  console.log(`Your local IP addresses:`);
  
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`  http://${net.address}:${PORT}`);
      }
    }
  }
});
