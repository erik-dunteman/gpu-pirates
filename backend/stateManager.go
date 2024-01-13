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
	Islands map[string]*Island `json:"islands"`
	Ships   map[string]*Ship   `json:"ships"`
}

func (g *GlobalState) AddPlayer(playerID string) {
	// create player
	player := &Player{ID: playerID, X: 1000, Y: 1000, Velocity: 0, Angle: -90, Controls: "walk"}
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

	state := UserVisibleState{
		ThisPlayer: player,
		Players:    make(map[string]*Player),
		Islands:    make(map[string]*Island),
		Ships:      make(map[string]*Ship),
	}

	for _, p := range g.Players {
		if p.ID == playerID {
			continue
		}
		if p.X >= player.X-radius && p.X <= player.X+radius && p.Y >= player.Y-radius && p.Y <= player.Y+radius {
			state.Players[p.ID] = p
		}
	}

	for _, island := range g.Islands {
		for _, vertex := range island.Vertices {
			// if any of the vertices are within the radius, then add the island
			if vertex.X >= player.X-radius && vertex.X <= player.X+radius && vertex.Y >= player.Y-radius && vertex.Y <= player.Y+radius {
				state.Islands[island.ID] = island
				break
			}
		}
	}

	for _, ship := range g.Ships {
		if ship.X >= player.X-radius && ship.X <= player.X+radius && ship.Y >= player.Y-radius && ship.Y <= player.Y+radius {
			state.Ships[ship.ID] = ship
		}
	}

	return state
}

// global game state
var globalState GlobalState

func InitGlobalState() {
	players := make(map[string]*Player)
	islands := loadIslands()
	ships := make(map[string]*Ship)
	globalState = GlobalState{Players: players, Islands: islands, Ships: ships}

	// add ship
	ship := NewShip("ship1", 10000, 10000)
	// ship.Velocity = 1000
	globalState.Ships[ship.ID] = ship
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
		fmt.Println("Ships:")
		for _, s := range globalState.Ships {
			fmt.Printf("  %s: (%d, %d, %d, %f)\n", s.ID, s.X, s.Y, s.Velocity, s.Angle)
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

			switch player.Controls {
			case "walk":
				player.accelerate()
			case "pilot":
				ship := globalState.Ships[player.ShipID]
				if ship != nil {
					ship.accelerate()
				}
			default:
				// do nothing
			}
		case "keyDownLeft":
			player := globalState.Players[event.PlayerID]
			switch player.Controls {
			case "walk":
				player.turnLeft()
			case "pilot":
				ship := globalState.Ships[player.ShipID]
				if ship != nil {
					ship.turnLeft()
				}
			default:
				// do nothing
			}
		case "keyDownDown":
			player := globalState.Players[event.PlayerID]
			switch player.Controls {
			case "walk":
				player.reverse()
			default:
				// do nothing
			}
		case "keyDownRight":
			player := globalState.Players[event.PlayerID]
			switch player.Controls {
			case "walk":
				player.turnRight()
			case "pilot":
				ship := globalState.Ships[player.ShipID]
				if ship != nil {
					ship.turnRight()
				}
			default:
				// do nothing
			}

		case "interract":
			// interract with something
			interraction := event.Data
			player := globalState.Players[event.PlayerID]
			if player == nil {
				continue
			}
			switch interraction {
			case "pilot":
				// pilot ship, if player is on an unpiloted ship
				if player.ShipID == "" {
					continue
				}
				ship := globalState.Ships[player.ShipID]
				if ship == nil {
					continue
				}
				if ship.Pilot != nil {
					// ship already has a pilot
					continue
				}
				player.pilot(ship)
			case "unpilot":
				// unpilot ship, if player is on a piloted ship
				if player.ShipID == "" {
					continue
				}
				ship := globalState.Ships[player.ShipID]
				if ship == nil {
					continue
				}
				player.unpilot(ship)
			default:
				// do nothing
			}

		case "board":
			// board ship
			targetShipID := event.Data
			targetShip := globalState.Ships[targetShipID]
			if targetShip == nil {
				continue
			}
			player := globalState.Players[event.PlayerID]
			if player == nil {
				continue
			}
			if player.ShipID != "" {
				// player is already on a ship
				continue
			}
			player.board(targetShip)
		case "unboard":
			// unboard ship
			targetShipID := event.Data
			targetShip := globalState.Ships[targetShipID]
			if targetShip == nil {
				continue
			}
			player := globalState.Players[event.PlayerID]
			if player == nil {
				continue
			}
			if player.ShipID != targetShipID {
				// player is not on this ship
				continue
			}
			player.unboard(targetShip)

		default:
			// do nothing
		}
	}
}
