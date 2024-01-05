package main

import (
	"fmt"
	"log"
	"net/http"

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

	playerID := uuid.New().String()

	// add player to game state
	eventChan <- Event{PlayerID: playerID, Type: "addPlayer"}

	// Define a cleanup function to be executed when the connection is closed
	cleanup := func() {
		// Perform any cleanup actions here (e.g., remove the player from the game state)
		eventChan <- Event{PlayerID: playerID, Type: "removePlayer"}
	}

	// Set the close handler to execute the cleanup function
	conn.SetCloseHandler(func(code int, text string) error {
		cleanup()
		return nil
	})

	go sendGameStateUpdates(conn, playerID)

	for {
		// Read a message from the WebSocket client
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}

		if messageType == websocket.TextMessage {
			message := string(p)

			switch message {
			case "w":
				eventChan <- Event{PlayerID: playerID, Type: "keyDownUp"}
			case "a":
				eventChan <- Event{PlayerID: playerID, Type: "keyDownLeft"}
			case "s":
				eventChan <- Event{PlayerID: playerID, Type: "keyDownDown"}
			case "d":
				eventChan <- Event{PlayerID: playerID, Type: "keyDownRight"}
			default:
				// Print the received character
				fmt.Printf("Received: %s\n", message)
			}
		}
	}
}

func main() {
	http.HandleFunc("/ws", handleWebSocketConnection)
	http.HandleFunc("/reset", func(w http.ResponseWriter, r *http.Request) {
		eventChan <- Event{Type: "reset"}
		w.WriteHeader(http.StatusOK)
	})

	// start the game state
	initGameState()
	go debug()
	go initChannels()
	go runGameState()

	// Start the WebSocket server
	port := "8080"
	fmt.Printf("WebSocket server started on :%s/ws\n", port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal("Error starting server: ", err)
	}
}
