package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

var eventChan chan Event

type Event struct {
	PlayerID string `json:"playerID"`
	Type     string `json:"type"`
	Data     string `json:"data"`
}

// players on map

type Player struct {
	ID string `json:"id"`
	X  int    `json:"x"`
	Y  int    `json:"y"`
}

type GameState struct {
	Players map[string]*Player `json:"players"`
}

type GameStateVisible struct {
	ThisPlayer *Player            `json:"thisPlayer"` // only relavent for sending to client
	Players    map[string]*Player `json:"players"`
}

func (g *GameState) AddPlayer(player *Player) {
	// add player if it doesn't exist
	if gameState.Players[player.ID] == nil {
		fmt.Println("Adding player", player.ID)
		g.Players[player.ID] = player
	}
}

func (g *GameState) RemovePlayer(playerID string) {
	// delete player if exists
	if gameState.Players[playerID] != nil {
		fmt.Println("Removing player", playerID)
		delete(g.Players, playerID)
	}
}

func (g *GameState) UpdatePlayer(player *Player) {
	g.Players[player.ID] = player
}

func (g *GameState) GetPlayer(playerID string) *Player {
	return g.Players[playerID]
}

// not technically circular radius, but square radius
func (g *GameState) FilterForClientUpdate(playerID string, radius int) GameStateVisible {
	// reference player
	player := g.GetPlayer(playerID)
	if player == nil {
		return GameStateVisible{} // return empty game state
	}

	state := GameStateVisible{ThisPlayer: player, Players: make(map[string]*Player)}

	for _, p := range g.Players {
		if p.ID == playerID {
			continue
		}
		if p.X >= player.X-radius && p.X <= player.X+radius && p.Y >= player.Y-radius && p.Y <= player.Y+radius {
			state.Players[p.ID] = p
		}
	}

	return state
}

// whole game state
var gameState GameState

func initGameState() {
	players := make(map[string]*Player)
	gameState = GameState{Players: players}
}

func initChannels() {
	eventChan = make(chan Event)
}

func debug() {
	for {

		fmt.Println("Players:")
		for _, p := range gameState.Players {
			fmt.Printf("  %s: (%d, %d)\n", p.ID, p.X, p.Y)
		}
		fmt.Println()
		time.Sleep(1 * time.Second)
	}
}

func runGameState() {
	// only a single thread can update the game state at a time to prevent race conditions
	for {
		event := <-eventChan
		switch event.Type {
		case "reset":
			// reset game state
			initGameState()
		case "addPlayer":
			// add player to game state if it doesn't exist
			gameState.AddPlayer(&Player{ID: event.PlayerID, X: 0, Y: 0})
		case "removePlayer":
			// remove player from game state if it exists
			gameState.RemovePlayer(event.PlayerID)
		case "keyDownUp":
			player := gameState.Players[event.PlayerID]
			player.Y--
		case "keyDownLeft":
			player := gameState.Players[event.PlayerID]
			player.X--
		case "keyDownDown":
			player := gameState.Players[event.PlayerID]
			player.Y++
		case "keyDownRight":
			player := gameState.Players[event.PlayerID]
			player.X++
		default:
			// do nothing
		}
	}
}

func sendGameStateUpdates(conn *websocket.Conn, playerID string) {
	for {
		// Retrieve the game state or relevant data that you want to send to the client
		filteredState := gameState.FilterForClientUpdate(playerID, 500)

		// Convert the game state to JSON (you can use a library like encoding/json)
		jsonData, err := json.Marshal(filteredState)
		if err != nil {
			log.Println("Error encoding game state:", err)
			return
		}

		// Send the JSON data to the client
		err = conn.WriteMessage(websocket.TextMessage, jsonData)
		if err != nil {
			if err.Error() != "websocket: close sent" {
				// unexpected error
				log.Println("Error sending game state to client:", err)
			}
			return
		}

		// Add a delay (e.g., time.Sleep) if you want to control the rate of updates
		time.Sleep(16 * time.Millisecond) // 60 fps, roughly
	}
}
