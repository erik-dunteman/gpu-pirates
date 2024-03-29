package main

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

// this file is for streaming game state to clients

type UserVisibleState struct {
	ThisPlayer  *Player                `json:"thisPlayer"` // only relavent for sending to client
	Players     map[string]*Player     `json:"players"`
	Islands     map[string]*Island     `json:"islands"`
	Ships       map[string]*Ship       `json:"ships"`
	CannonBalls map[string]*CannonBall `json:"cannonBalls"`
}

func StreamGameState(conn *websocket.Conn, playerID string) {
	const tickRate = 60 // ticks per second
	ticker := time.NewTicker((1000 / tickRate) * time.Millisecond)

	for {

		// Filter the game state for the client so they only see within a certain radius
		filteredState := globalState.FilterForUser(playerID, 100_000) // 100 meter radius

		// Send filtered game state to client
		jsonData, err := json.Marshal(filteredState)
		if err != nil {
			log.Println("Error encoding game state:", err)
			return
		}

		err = conn.WriteMessage(websocket.TextMessage, jsonData)
		if err != nil {
			if err.Error() != "websocket: close sent" {
				// unexpected error
				log.Println("Error sending game state to client:", err)
			}
			return
		}

		// delay for game state update
		<-ticker.C
	}
}
