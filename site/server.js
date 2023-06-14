import express from "express";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class TeamPickerServer {
  constructor() {
    this.app = express();
    this.app.use(cors());

    console.log(__dirname);

    const distPath = path.join(__dirname, "dist");
    console.log(`dist: ${distPath}`);
    this.app.use(express.static(distPath));
    
    const assetsPath = path.join(__dirname, "../../dist/assets");
    console.log(`assets: ${assetsPath}`);
    this.app.use("/assets", express.static(assetsPath));
    
    
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    this.turn = "team1";
    this.availablePlayers = [];
    this.selectedTeams = {
      team1: [],
      team2: [],
    };
    this.setupSocket();
    this.setupRoutes();
  }

  setupSocket() {
    this.io.on("connection", (socket) => {
      let team = "";
  
      if (socket.handshake.headers.referer.includes("/team1")) {
        team = "team1";
      } else if (socket.handshake.headers.referer.includes("/team2")) {
        team = "team2";
      }
  
      // If neither /team1 nor /team2, assign team randomly
      if (team === "") {
        team = this.determineTeam();
        if (team === this.lastPlayerTurn) {
          team = team === "team1" ? "team2" : "team1";
        }
      }
  
      this.lastPlayerTurn = team;
      socket.team = team;
      socket.emit("setTeam", team);
      socket.emit("updatePlayers", this.availablePlayers);
      socket.emit("updateTeams", this.selectedTeams);
      socket.emit("turn", this.turn);
  
      socket.on("addPlayers", (players) => {
        this.availablePlayers = players;
        this.io.emit("updatePlayers", this.availablePlayers);
      });
  
      socket.on("pickPlayer", (player) => {
        if (this.turn === socket.team && this.availablePlayers.includes(player)) {
          this.pickPlayer(socket, player);
        }
      });
  
      socket.on("reset", () => {
        this.resetGame();
      });
  
      socket.on("requestState", () => {
        socket.emit("updatePlayers", this.availablePlayers);
        socket.emit("updateTeams", this.selectedTeams);
        socket.emit("turn", this.turn);
      });
  
      socket.on("disconnect", () => {
        console.log("A user disconnected");
      });
    });
  }
  

  determineTeam() {
    let team;
    if (this.selectedTeams.team1.length <= this.selectedTeams.team2.length) {
      team = "team1";
    } else {
      team = "team2";
    }
    return team;
  }

  pickPlayer(socket, player) {
    this.availablePlayers = this.availablePlayers.filter((p) => p !== player);
    if (socket.team === "team1") {
      this.selectedTeams.team1.push(player);
      this.turn = "team2";
    } else {
      this.selectedTeams.team2.push(player);
      this.turn = "team1";
    }
    this.io.emit("updatePlayers", this.availablePlayers);
    this.io.emit("updateTeams", this.selectedTeams);
    this.io.emit("turn", this.turn);
  }

  resetGame() {
    this.availablePlayers = [];
    this.selectedTeams = {
      team1: [],
      team2: [],
    };
    this.turn = "team1";
    this.io.emit("updatePlayers", this.availablePlayers);
    this.io.emit("updateTeams", this.selectedTeams);
    this.io.emit("turn", this.turn);
  }

  setupRoutes() {
    this.app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "../index.html"));
    });

    this.app.get("/admin", (req, res) => {
      res.sendFile(path.join(__dirname, "../index.html"));
    });

    this.app.get("/team1", (req, res) => {
      res.sendFile(path.join(__dirname, "../index.html"));
    });

    this.app.get("/team2", (req, res) => {
      res.sendFile(path.join(__dirname, "../index.html"));
    });
  }

  start(port) {
    this.server.listen(port, "0.0.0.0", () => {
      console.log(`Server started on port ${port}`);
    });
  }
}

const PORT = process.env.PORT || 3000;
const server = new TeamPickerServer();
server.start(PORT);

