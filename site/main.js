import './style.css';

class TeamPickerClient {
  constructor(socket) {
    this.socket = socket;
    this.availablePlayers = [];
    this.selectedTeams = {
      team1: [],
      team2: [],
    };
    this.turn = 'team1'; // Initialize the turn
  }  

  addPlayers(players) {
    this.socket.emit('addPlayers', players);
  }

  reset() {
    this.socket.emit('reset');
  }

  pickPlayer(player) {
    // Only allow picking a player if it's the client's turn
    if (this.team === this.turn) {
      if (window.confirm(`Are you sure you want to pick ${player}?`)) {
        this.socket.emit('pickPlayer', player);
      }
    } else {
      window.alert(`Wait for your turn, Team ${this.team}`);
    }
  }

    // Add this method to set the team
    setTeam(team) {
      this.team = team;
    }

  listenForUpdates() {
    this.socket.on('updatePlayers', (players) => {
      this.availablePlayers = players;
      this.updateAvailablePlayersUI();
    });

    this.socket.on('setTeam', (team) => {
      this.setTeam(team);
    });

    this.socket.on('updateTeams', (teams) => {
      this.selectedTeams = teams;
      this.updateSelectedTeamsUI();
    });

    // Request the initial state from the server
    this.socket.emit('requestState');

    this.socket.on('turn', (turn) => {
      this.turn = turn;
      this.updateTurnUI();
    });
  }

  updateAvailablePlayersUI() {
    const playersElement = document.getElementById('players');
    playersElement.innerHTML = '';

    for (const player of this.availablePlayers) {
      const button = document.createElement('button');
      button.innerText = player;
      button.addEventListener('click', () => {
        if (this.turn === 'team1' || this.turn === 'team2') {
          this.pickPlayer(player);
        }
      });
      playersElement.appendChild(button);
    }
  }

  updateSelectedTeamsUI() {
    const teamsElement = document.getElementById('teams');
    teamsElement.innerHTML = '';
  
    const team1Element = document.createElement('div');
    team1Element.innerText = `Team 1: ${this.selectedTeams.team1 && this.selectedTeams.team1.length > 0 ? this.selectedTeams.team1.join(', ') : 'No players selected'}`;
    teamsElement.appendChild(team1Element);
  
    const team2Element = document.createElement('div');
    team2Element.innerText = `Team 2: ${this.selectedTeams.team2 && this.selectedTeams.team2.length > 0 ? this.selectedTeams.team2.join(', ') : 'No players selected'}`;
    teamsElement.appendChild(team2Element);
  }
  
  updateTurnUI() {
    const turnElement = document.getElementById('turn');
    if (this.turn === 'team1') {
      turnElement.innerText = 'Team 1\'s Turn';
    } else if (this.turn === 'team2') {
      turnElement.innerText = 'Team 2\'s Turn';
    } else {
      turnElement.innerText = '';
    }
  }
  
}

const socket = io('http://localhost:3000');
const client = new TeamPickerClient(socket);

if (window.location.pathname === '/admin') {
  document.getElementById('admin').style.display = 'block';

  document.getElementById('reset').addEventListener('click', () => {
    client.reset();
  });

} else {
  document.getElementById('admin').style.display = 'none';
}

client.listenForUpdates();

document.getElementById('addPlayers').addEventListener('click', () => {
  const players = document.getElementById('playerNames').value.split('\n');
  client.addPlayers(players);
});

document.getElementById('copyButton').addEventListener('click', () => {
  // Generate the text for the teams
  const team1Text = `Team 1: ${client.selectedTeams.team1.join(', ')}`;
  const team2Text = `Team 2: ${client.selectedTeams.team2.join(', ')}`;
  const fullText = `${team1Text}\n${team2Text}`;

  // Copy the text to the clipboard
  navigator.clipboard.writeText(fullText).then(() => {
    console.log('Copied to clipboard');
  }).catch((err) => {
    console.log('Error copying to clipboard', err);
  });
});