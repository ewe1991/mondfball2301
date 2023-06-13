import './style.css';

class TeamPickerClient {
  constructor(socket) {
    this.socket = socket;
    this.availablePlayers = [];
    this.selectedTeams = {
      team1: [],
      team2: [],
    };
    this.turn = ''; // Initialize the turn
  }

  addPlayers(players) {
    this.socket.emit('addPlayers', players);
  }

  reset() {
    this.socket.emit('reset');
  }

  pickPlayer(player) {
    if ((this.turn === 'team1' && this.team === 'team1') || (this.turn === 'team2' && this.team === 'team2')) {
      if (window.confirm(`Are you sure you want to pick ${player}?`)) {
        this.socket.emit('pickPlayer', player);
      }
    } else {
      const currentTeam = this.turn === 'team1' ? 'Team 1' : 'Team 2';
      window.alert(`Wait for your turn, it's ${currentTeam}'s turn.`);
    }
  }
  

  setTeam(team) {
    this.team = team;
    this.updateTurnUI(); // Update the turn UI when the team is set
  }

  listenForUpdates() {
    this.socket.on('setTeam', (team) => {
      this.setTeam(team);
      this.updateTurnUI(); // Update the turn UI when the team is set
    });

    this.socket.on('updatePlayers', (players) => {
      this.availablePlayers = players;
      this.updateAvailablePlayersUI();
    });

    this.socket.on('updateTeams', (teams) => {
      this.selectedTeams = teams;
      this.updateSelectedTeamsUI();
    });

    this.socket.on('turn', (turn) => {
      this.turn = turn;
      this.updateTurnUI(); // Update the turn UI when the turn is updated
    });

    this.socket.emit('requestState');
  }

  updateAvailablePlayersUI() {
    const playersElement = document.getElementById('players');
    playersElement.innerHTML = '';

    for (const player of this.availablePlayers) {
      const button = document.createElement('button');
      button.innerText = player;
      button.addEventListener('click', () => {
        this.pickPlayer(player);
      });
      playersElement.appendChild(button);
    }
  }

  updateSelectedTeamsUI() {
    const teamsElement = document.getElementById('teams');
    teamsElement.innerHTML = '';

    const team1Element = document.createElement('div');
    team1Element.innerText = `Team 1: ${this.selectedTeams.team1.join(', ')}`;
    teamsElement.appendChild(team1Element);

    const team2Element = document.createElement('div');
    team2Element.innerText = `Team 2: ${this.selectedTeams.team2.join(', ')}`;
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

  clearPlayers() {
    this.socket.emit('clearPlayers');
  }
}

const socket = io('http://localhost:3000');
const client = new TeamPickerClient(socket);

// Set the team based on the current pathname
if (window.location.pathname === '/team1') {
  client.team = 'team1';
} else if (window.location.pathname === '/team2') {
  client.team = 'team2';
}

if (window.location.pathname === '/admin') {
  document.getElementById('admin').style.display = 'block';

  document.getElementById('reset').addEventListener('click', () => {
    client.reset();
  });

  document.getElementById('clearPlayers').addEventListener('click', () => {
    client.clearPlayers();
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
  const team1Text = `Team 1: ${client.selectedTeams.team1.join(', ')}`;
  const team2Text = `Team 2: ${client.selectedTeams.team2.join(', ')}`;
  const fullText = `${team1Text}\n${team2Text}`;

  navigator.clipboard.writeText(fullText).then(() => {
    console.log('Copied to clipboard');
  }).catch((err) => {
    console.log('Error copying to clipboard', err);
  });
});
