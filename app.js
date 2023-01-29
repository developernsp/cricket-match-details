const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const dbpath = path.join(__dirname, "cricketMatchDetails.db");
app.use(express.json());

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const playerDetails = function (player) {
  return {
    playerId: player.player_id,
    playerName: player.player_name,
  };
};

const eachPlayerMatchDetail = function (eachMatch) {
  return {
    matchId: eachMatch.match_id,
    match: eachMatch.match,
    year: eachMatch.year,
  };
};

const playerMatchDetails = function (player) {
  return {
    playerId: player.player_id,
    playerName: player.player_name,
  };
};

//GET list of all players in player_details API

app.get("/players/", async (request, response) => {
  const getAllPlayerDetailsQuery = `
        SELECT *
        FROM player_details;`;
  const playersArray = await db.all(getAllPlayerDetailsQuery);
  response.send(playersArray.map((player) => playerDetails(player)));
});

//GET single player details API

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getplayerDetailsQuery = `
        SELECT *
        FROM player_details
        WHERE player_id = ${playerId};`;
  const playerDetails = await db.get(getplayerDetailsQuery);
  response.send({
    playerId: playerDetails.player_id,
    playerName: playerDetails.player_name,
  });
});

//PUT playerName based on id API

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;

  const UpdatePlayerDetailsQuery = `
        UPDATE
            player_details
        SET 
            player_name = "${playerName}"
        WHERE player_id = ${playerId};`;
  await db.run(UpdatePlayerDetailsQuery);
  response.send("Player Details Updated");
});

//GET single match details API

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
        SELECT * 
        FROM match_details
        WHERE match_id = ${matchId};`;
  const matchDetails = await db.get(getMatchDetails);
  response.send({
    matchId: matchDetails.match_id,
    match: matchDetails.match,
    year: matchDetails.year,
  });
});

//GET all matches of player API

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
        SELECT *
        FROM player_match_score
            NATURAL JOIN match_details
        WHERE player_id = ${playerId};`;
  const playerMatches = await db.all(getPlayerMatchesQuery);
  response.send(
    playerMatches.map((eachMatch) => eachPlayerMatchDetail(eachMatch))
  );
});

//GET all players based on match API

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersDetailsQuery = `
    SELECT
      *
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;
  const players = await db.all(getPlayersDetailsQuery);
  response.send(players.map((player) => playerMatchDetails(player)));
});

//GET player all scores details API
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`;

  const playersScores = await db.get(getPlayerScored);
  response.send(playersScores);
});

module.exports = app;
