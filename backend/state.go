package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
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

const PlayerMaxVelocity = 5000 // 5 meters per second
const PlayerTurnSpeed = 3      // 1 degree per tick

type Player struct {
	ID       string  `json:"id"`
	X        int64   `json:"x"`
	Y        int64   `json:"y"`
	Velocity int64   `json:"velocity"`
	Angle    float64 `json:"angle"`
}

func (p *Player) accelerate() {
	p.Velocity += 200
	if p.Velocity > PlayerMaxVelocity {
		p.Velocity = PlayerMaxVelocity
	}
}

func (p *Player) reverse() {
	p.Velocity -= 200
	if p.Velocity < -PlayerMaxVelocity*0.4 { // reverse speed is 40% of forward speed
		p.Velocity = -PlayerMaxVelocity * 0.4
	}
}

func (p *Player) turnLeft() {
	p.Angle += PlayerTurnSpeed
}

func (p *Player) turnRight() {
	p.Angle -= PlayerTurnSpeed
}

func (p *Player) update() {
	const tickRate = 60 // ticks per second
	t := time.NewTicker((1000 / tickRate) * time.Millisecond)

	for {
		<-t.C
		vel := p.Velocity
		if vel > PlayerMaxVelocity {
			vel = PlayerMaxVelocity
		}

		p.X += int64(float64(vel) * math.Cos(p.Angle*math.Pi/180) / float64(tickRate))
		p.Y += int64(float64(vel) * -math.Sin(p.Angle*math.Pi/180) / float64(tickRate))

		// decay velocity
		decay := 0.95
		p.Velocity = int64(float64(p.Velocity) * decay)
	}
}

type GameState struct {
	Players map[string]*Player `json:"players"`
}

type GameStateVisible struct {
	ThisPlayer *Player            `json:"thisPlayer"` // only relavent for sending to client
	Players    map[string]*Player `json:"players"`
}

func (g *GameState) AddPlayer(playerID string) {
	// create player
	player := &Player{ID: playerID, X: 0, Y: 0, Velocity: 0, Angle: 90}
	go player.update()

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
func (g *GameState) FilterForClientUpdate(playerID string, radius int64) GameStateVisible {
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
			fmt.Printf("  %s: (%d, %d, %d, %f)\n", p.ID, p.X, p.Y, p.Velocity, p.Angle)
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
			gameState.AddPlayer(event.PlayerID)
		case "removePlayer":
			// remove player from game state if it exists
			gameState.RemovePlayer(event.PlayerID)
		case "keyDownUp":
			player := gameState.Players[event.PlayerID]
			player.accelerate()
		case "keyDownLeft":
			player := gameState.Players[event.PlayerID]
			player.turnLeft()
		case "keyDownDown":
			player := gameState.Players[event.PlayerID]
			player.reverse()
		case "keyDownRight":
			player := gameState.Players[event.PlayerID]
			player.turnRight()
		default:
			// do nothing
		}
	}
}

func sendGameStateUpdates(conn *websocket.Conn, playerID string) {
	for {
		// Retrieve the game state or relevant data that you want to send to the client
		filteredState := gameState.FilterForClientUpdate(playerID, 200_000) // 200 meters

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
