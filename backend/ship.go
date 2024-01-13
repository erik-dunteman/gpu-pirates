package main

import (
	"math"
	"time"
)

const ShipMaxVelocity = 50_000 // 50 meters per second
const ShipAcceleration = 2_000 // 2 per second per second
const ShipTurnSpeed = 0.3      // 0.3 degrees per tick

func NewShip(id string, x int64, y int64) *Ship {
	ship := &Ship{ID: id, X: x, Y: y, Velocity: 0, Angle: -90}
	go ship.update()
	return ship
}

type Ship struct {
	ID       string    `json:"id"`
	X        int64     `json:"x"`
	Y        int64     `json:"y"`
	Velocity int64     `json:"velocity"`
	Angle    float64   `json:"angle"`
	Crew     []*Player `json:"crew"`
	Pilot    *Player   `json:"pilot"`
}

func (s *Ship) accelerate() {
	s.Velocity += ShipAcceleration
	if s.Velocity > ShipMaxVelocity {
		s.Velocity = ShipMaxVelocity
	}
}

func (s *Ship) turnLeft() {
	s.Angle += ShipTurnSpeed
}

func (s *Ship) turnRight() {
	s.Angle -= ShipTurnSpeed
}

func (s *Ship) update() {
	const tickRate = 60 // ticks per second
	t := time.NewTicker((1000 / tickRate) * time.Millisecond)

	for {
		<-t.C
		vel := s.Velocity

		newX := s.X + int64(float64(vel)*math.Cos(s.Angle*math.Pi/180)/float64(tickRate))
		newY := s.Y + int64(float64(vel)*-math.Sin(s.Angle*math.Pi/180)/float64(tickRate))
		if newX < 0 || newX > maxDimension || newY < 0 || newY > maxDimension {
			// player is out of bounds, so stop them
			s.Velocity = 0

			// move player back into bounds
			if newX < 0 {
				newX = 0
			}
			if newX > maxDimension {
				newX = maxDimension
			}
			if newY < 0 {
				newY = 0
			}
			if newY > maxDimension {
				newY = maxDimension
			}
		}

		// get x,y diffs to also update crew
		diffX := newX - s.X
		diffY := newY - s.Y

		s.X = newX
		s.Y = newY

		// move crew with ship
		for _, crew := range s.Crew {
			crew.X += diffX
			crew.Y += diffY
		}

		// // decay velocity
		// decay := 0.95
		// s.Velocity = int64(float64(s.Velocity) * decay)
	}
}
