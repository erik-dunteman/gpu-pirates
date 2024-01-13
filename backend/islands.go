package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
)

const maxDimension = 1_000_000

type Vertex struct {
	X int64 `json:"x"`
	Y int64 `json:"y"`
}
type Island struct {
	Vertices []Vertex `json:"vertices"`
	ID       string   `json:"ID"`
}

type IslandsJson struct {
	Islands []*Island `json:"islands"`
}

func loadIslands() map[string]*Island {
	file, err := os.Open("islands.json")
	if err != nil {
		fmt.Println("Error opening file:", err)
		return nil
	}
	defer file.Close()
	byteValue, err := io.ReadAll(file)
	if err != nil {
		fmt.Println("Error reading file:", err)
		return nil
	}

	var mapData IslandsJson
	err = json.Unmarshal(byteValue, &mapData)
	if err != nil {
		fmt.Println("Error unmarshaling JSON:", err)
		return nil
	}

	islands := make(map[string]*Island)
	for _, island := range mapData.Islands {
		islands[island.ID] = island
	}

	return islands
}
