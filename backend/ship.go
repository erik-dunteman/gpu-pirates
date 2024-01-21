package main

import (
	"fmt"
	"math"
	"time"
)

const ShipMaxVelocity = 50_000      // 50 meters per second
const ShipAcceleration = 5          // 0.005 per second per second (slow)
const ShipDecay = 0.999             // velocity *= this, per tick
const ShipTurnSpeed = 0.3           // 0.3 degrees per tick
const shipDecayGracePeriodMS = 1000 // 1000ms before decay starts.
const shipWidth = 5000              // 5 meters per shipScale
const shipScale = 2                 // static for now

func NewShip(id string, x int64, y int64) *Ship {
	cannons := make(map[string]*Cannon)
	cannons["1"] = &Cannon{ID: "1", Side: "left", Angle: 180, Pos: 0}
	cannons["2"] = &Cannon{ID: "2", Side: "right", Angle: 0, Pos: 0}
	ship := &Ship{ID: id, X: x, Y: y, Velocity: 0, Angle: -90, Cannons: cannons, Health: 100}
	go ship.update()
	return ship
}

type Ship struct {
	ID             string             `json:"id"`
	X              int64              `json:"x"`
	Y              int64              `json:"y"`
	Health         int16              `json:"health"`
	Velocity       int64              `json:"velocity"`
	Angle          float64            `json:"angle"`
	Crew           []*Player          `json:"crew"`
	Pilot          *Player            `json:"pilot"`
	CrowsNest      *Player            `json:"crowsNest"`
	Cannons        map[string]*Cannon `json:"cannons"`
	lastAccelerate time.Time          // only decay if it's been time since last accelerate, to prevent jerky velocity

}

func (s *Ship) accelerate() {
	s.lastAccelerate = time.Now()
	s.Velocity += ShipAcceleration
	if s.Velocity > ShipMaxVelocity {
		s.Velocity = ShipMaxVelocity
	}
}

func translatePlayerOnShipRotation(s *Ship, p *Player, angleDiff float64) {
	p.Angle += angleDiff
	// distance to ship origin unchanged
	xOffset := float64(p.X) - float64(s.X)
	yOffset := float64(p.Y) - float64(s.Y)
	rad := math.Sqrt(math.Pow(xOffset, 2) + math.Pow(yOffset, 2))
	// Use Atan2 to get the original angle in all quadrants
	origAngle := math.Atan2(yOffset, xOffset) * 180 / math.Pi
	newAngle := origAngle - angleDiff
	newXOffset := rad * math.Cos(newAngle*math.Pi/180)
	newYOffset := rad * math.Sin(newAngle*math.Pi/180)
	p.X = s.X + int64(newXOffset)
	p.Y = s.Y + int64(newYOffset)
}

func (s *Ship) turnLeft() {
	s.Angle += ShipTurnSpeed
	for _, p := range s.Crew {
		translatePlayerOnShipRotation(s, p, ShipTurnSpeed)
	}
	for _, c := range s.Cannons {
		c.Angle += ShipTurnSpeed
	}
}

func (s *Ship) turnRight() {
	s.Angle -= ShipTurnSpeed
	for _, p := range s.Crew {
		translatePlayerOnShipRotation(s, p, -ShipTurnSpeed)
	}
	for _, c := range s.Cannons {
		c.Angle -= ShipTurnSpeed
	}
}

func (s *Ship) update() {
	const tickRate = 120 // ticks per second
	t := time.NewTicker((1000 / tickRate) * time.Millisecond)

	for {
		<-t.C

		// destroy ship if health is 0
		if s.Health <= 0 {
			s.destroy()
			return
		}

		vel := s.Velocity

		newX := s.X + int64(float64(vel)*math.Cos(s.Angle*math.Pi/180)/float64(tickRate))
		newY := s.Y + int64(float64(vel)*-math.Sin(s.Angle*math.Pi/180)/float64(tickRate))
		if newX < 0 || newX > maxDimension || newY < 0 || newY > maxDimension {
			// ship is out of bounds, so stop it
			s.Velocity = 0

			// move ship back into bounds
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

		if time.Since(s.lastAccelerate) > shipDecayGracePeriodMS*time.Millisecond {
			// decay velocity
			s.Velocity = int64(float64(s.Velocity) * ShipDecay)
		}
	}
}

func (s *Ship) GetCannon(id string) *Cannon {
	return s.Cannons[id]
}

func (s *Ship) takeCannonDamage(cb *CannonBall) {
	s.Health -= CannonBallDamage
	fmt.Println("health is now", s.Health)
	if s.Health < 0 {
		s.Health = 0
	}

	// delete cannonball
	mutateRequest := func(innerState GlobalState) GlobalState {
		delete(innerState.CannonBalls, cb.ID)
		return innerState
	}
	ScheduleMutation(mutateRequest)
}

func (s *Ship) destroy() {
	// unboard crew
	if s.Pilot != nil {
		s.Pilot.unPilot(s)
	}
	if s.CrowsNest != nil {
		s.CrowsNest.unCrowsNest(s)
	}
	for _, p := range s.Crew {
		p.unboard(s)
	}

	// delete ship
	mutateRequest := func(innerState GlobalState) GlobalState {
		delete(innerState.Ships, s.ID)
		return innerState
	}
	ScheduleMutation(mutateRequest)
}
