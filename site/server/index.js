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
    this.lastAssignedTeam = 'team2'; // Track the last team that was assigned
    this.socketTeams = {}; // Keep track of the teams for each socket
    this.setupSocket();
  }

  reset() {
    this.selectedTeams = {
      team1: [],
      team2: [],
    };
    this.io.emit('updateTeams', this.selectedTeams);
  }

  setupSocket() {
    this.io.on('connection', (socket) => {
      
      // Assign the client to a team and inform them
      const team = this.lastAssignedTeam === 'team1' ? 'team2' : 'team1';
      this.lastAssignedTeam = team;
      this.socketTeams[socket.id] = team;
      socket.emit('setTeam', team);

      socket.emit('updatePlayers', this.availablePlayers);
      socket.emit('updateTeams', this.selectedTeams);
      socket.emit('turn', this.turn);

      socket.on('addPlayers', (players) => {
        this.availablePlayers = players;
        this.io.emit('updatePlayers', this.availablePlayers);
      });

      socket.on('pickPlayer', (player) => {
        // Only allow picking a player if it's the client's turn
        if (this.socketTeams[socket.id] === this.turn && this.availablePlayers.includes(player)) {
          this.availablePlayers = this.availablePlayers.filter((p) => p !== player);
          const { team1, team2 } = this.selectedTeams;
          if (this.turn === 'team1') {
            team1.push(player);
            this.turn = 'team2'; // Switch the turn to Team 2
          } else {
            team2.push(player);
            this.turn = 'team1'; // Switch the turn back to Team 1
          }
          this.io.emit('updatePlayers', this.availablePlayers);
          this.io.emit('updateTeams', this.selectedTeams);
          this.io.emit('turn', this.turn);
        }
      });

      socket.on('disconnect', () => {
        delete this.socketTeams[socket.id]; // Clean up after disconnection
        console.log('A user disconnected');
      });

      socket.on('reset', () => {
        this.reset();
      });
    });
  }

  start(port) {
    this.server.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  }
}
const port = process.env.PORT || 3000;
const server = new TeamPickerServer();
server.start(port);
