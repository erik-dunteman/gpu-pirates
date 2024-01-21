package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all connections for simplicity. In a production environment, you should
		// implement a more secure origin check.
		return true
	},
}

func handleWebSocketConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer conn.Close()

	// create new player
	playerID := uuid.New().String()
	UserEventChan <- UserEvent{PlayerID: playerID, Type: "addPlayer"}

	conn.SetCloseHandler(func(code int, text string) error {
		// cleanup code
		UserEventChan <- UserEvent{PlayerID: playerID, Type: "removePlayer"}
		return nil
	})

	// start streaming game state to client
	go StreamGameState(conn, playerID)

	// listen for user input
	for {
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}

		if messageType == websocket.TextMessage {
			msg := strings.Split(string(p), ":")
			if len(msg) < 1 {
				continue
			}
			category := msg[0]
			switch category {
			case "w":
				UserEventChan <- UserEvent{PlayerID: playerID, Type: "keyDownUp"}
			case "a":
				UserEventChan <- UserEvent{PlayerID: playerID, Type: "keyDownLeft"}
			case "s":
				UserEventChan <- UserEvent{PlayerID: playerID, Type: "keyDownDown"}
			case "d":
				UserEventChan <- UserEvent{PlayerID: playerID, Type: "keyDownRight"}
			case "r":
				if len(msg) < 2 {
					continue
				}
				cannonID := msg[1]
				UserEventChan <- UserEvent{PlayerID: playerID, Type: "fireCannon", Data: cannonID}
			case "e":
				if len(msg) < 2 {
					continue
				}
				interraction := msg[1]
				interractionTarget := ""
				if len(msg) >= 3 {
					interractionTarget = msg[2]
				}
				UserEventChan <- UserEvent{PlayerID: playerID, Type: "interract", Data: interraction, Data2: interractionTarget}
			case "board":
				if len(msg) != 2 {
					continue
				}
				targetShipID := msg[1]
				UserEventChan <- UserEvent{PlayerID: playerID, Type: "board", Data: targetShipID}
			case "unboard":
				if len(msg) != 2 {
					continue
				}
				targetShipID := msg[1]
				UserEventChan <- UserEvent{PlayerID: playerID, Type: "unboard", Data: targetShipID}
			default:
				// Print the received character
				fmt.Printf("Received: %s\n", msg)
				// check if it contains
			}
		}
	}
}

func main() {
	http.HandleFunc("/ws", handleWebSocketConnection)
	http.HandleFunc("/reset", func(w http.ResponseWriter, r *http.Request) {
		UserEventChan <- UserEvent{Type: "reset"}
		w.WriteHeader(http.StatusOK)
	})

	// start the game state
	InitGlobalState()
	go InitEventChans()
	go RunGlobalState()

	// debug logging
	// go DebugGlobalState()

	// Start the WebSocket server
	port := "8080"
	fmt.Printf("WebSocket server started on :%s/ws\n", port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal("Error starting server: ", err)
	}
}
