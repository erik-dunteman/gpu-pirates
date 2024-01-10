package main

import (
	"fmt"
	"time"
)

var UserEventChan chan UserEvent

type UserEvent struct {
	PlayerID string `json:"playerID"`
	Type     string `json:"type"`
	Data     string `json:"data"`
}

type GlobalState struct {
	Players map[string]*Player `json:"players"`
}

func (g *GlobalState) AddPlayer(playerID string) {
	// create player
	player := &Player{ID: playerID, X: 0, Y: 0, Velocity: 0, Angle: 90}
	go player.update()

	// add player if it doesn't exist
	if globalState.Players[player.ID] == nil {
		fmt.Println("Adding player", player.ID)
		g.Players[player.ID] = player
	}
}

func (g *GlobalState) RemovePlayer(playerID string) {
	// delete player if exists
	if globalState.Players[playerID] != nil {
		fmt.Println("Removing player", playerID)
		delete(g.Players, playerID)
	}
}

func (g *GlobalState) UpdatePlayer(player *Player) {
	g.Players[player.ID] = player
}

func (g *GlobalState) GetPlayer(playerID string) *Player {
	return g.Players[playerID]
}

// not technically circular radius, but square radius
func (g *GlobalState) FilterForUser(playerID string, radius int64) UserVisibleState {
	// reference player
	player := g.GetPlayer(playerID)
	if player == nil {
		return UserVisibleState{} // return empty game state
	}

	state := UserVisibleState{ThisPlayer: player, Players: make(map[string]*Player)}

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

// global game state
var globalState GlobalState

func InitGlobalState() {
	players := make(map[string]*Player)
	globalState = GlobalState{Players: players}
}

func InitUserEventChan() {
	UserEventChan = make(chan UserEvent)
}

func DebugGlobalState() {
	for {
		fmt.Println("Players:")
		for _, p := range globalState.Players {
			fmt.Printf("  %s: (%d, %d, %d, %f)\n", p.ID, p.X, p.Y, p.Velocity, p.Angle)
		}
		fmt.Println()
		time.Sleep(1 * time.Second)
	}
}

func RunGlobalState() {
	// only a single thread can update the game state at a time to prevent race conditions
	for {
		event := <-UserEventChan
		switch event.Type {
		case "reset":
			// reset game state
			InitGlobalState()
		case "addPlayer":
			// add player to game state if it doesn't exist
			globalState.AddPlayer(event.PlayerID)
		case "removePlayer":
			// remove player from game state if it exists
			globalState.RemovePlayer(event.PlayerID)
		case "keyDownUp":
			player := globalState.Players[event.PlayerID]
			player.accelerate()
		case "keyDownLeft":
			player := globalState.Players[event.PlayerID]
			player.turnLeft()
		case "keyDownDown":
			player := globalState.Players[event.PlayerID]
			player.reverse()
		case "keyDownRight":
			player := globalState.Players[event.PlayerID]
			player.turnRight()
		default:
			// do nothing
		}
	}
}