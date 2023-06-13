import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';

class TeamPickerServer {
  constructor() {
    this.app = express();
    this.app.use(cors());
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*", // This allows all origins. Adjust according to your needs.
        methods: ["GET", "POST"]
      }
    });
    this.turn = 'team1'; // Initialize the turn to Team 1
    this.availablePlayers = [];
    this.selectedTeams = {
      team1: [],
      team2: [],
    };
    this.setupSocket();
  }

  setupSocket() {
    this.io.on('connection', (socket) => {
      // Assign the client to a team and inform them
      let team = this.selectedTeams.team1.length <= this.selectedTeams.team2.length ? 'team1' : 'team2';
      socket.emit('setTeam', team);

      socket.on('addPlayers', (players) => {
        this.availablePlayers = players;
        this.io.emit('updatePlayers', this.availablePlayers);
      });

      socket.on('pickPlayer', (player) => {
        if (this.availablePlayers.includes(player)) {
          this.availablePlayers = this.availablePlayers.filter((p) => p !== player);
          if (this.turn === 'team1') {
            this.selectedTeams.team1.push(player);
            this.turn = 'team2'; // Switch the turn to Team 2
          } else {
            this.selectedTeams.team2.push(player);
            this.turn = 'team1'; // Switch the turn back to Team 1
          }
          this.io.emit('updatePlayers', this.availablePlayers);
          this.io.emit('updateTeams', this.selectedTeams);
          this.io.emit('turn', this.turn);
        }
      });

      socket.on('disconnect', () => {
        console.log('A user disconnected');
      });
    });
  }

  start(port) {
    this.server.listen(port, '0.0.0.0', () => {
      console.log(`Server started on port ${port}`);
    });
  }
}

const PORT = process.env.PORT || 3000; // Use the PORT from the environment variables, otherwise use 3000 as default.
const server = new TeamPickerServer();
server.start(PORT);
