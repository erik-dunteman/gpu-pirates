package main

import (
	"math"
	"time"
)

const PlayerMaxVelocity = 5_000      // 5 meters per second
const PlayerAcceleration = 200       // 0.2 per second per second
const PlayerTurnSpeed = 3            // 3 degrees per tick
const playerDecayGracePeriodMS = 300 // 300ms before decay starts. If anyone's ping is less than this, bad time.
const interractRateLimit = 1000      // 1000ms between interractions

type rateLimits struct {
	pilot     time.Time
	crowsNest time.Time
}

type Player struct {
	ID             string    `json:"id"`
	X              int64     `json:"x"`
	Y              int64     `json:"y"`
	Velocity       int64     `json:"velocity"`
	Angle          float64   `json:"angle"`
	ShipID         string    `json:"shipID"` // use string ID instead of pointer to avoid circular reference
	Controls       string    `json:"controls"`
	lastAccelerate time.Time // only decay if it's been time since last accelerate, to prevent jerky velocity
	rateLimits     rateLimits
}

func (p *Player) accelerate() {
	p.lastAccelerate = time.Now()
	p.Velocity += PlayerAcceleration
	if p.Velocity > PlayerMaxVelocity {
		p.Velocity = PlayerMaxVelocity
	}
}

func (p *Player) reverse() {
	p.Velocity -= PlayerAcceleration
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

func (p *Player) board(ship *Ship) {
	p.ShipID = ship.ID
	ship.Crew = append(ship.Crew, p)
}

func (p *Player) unboard(ship *Ship) {
	p.ShipID = ""
	for i, crewMember := range ship.Crew {
		if crewMember.ID == p.ID {
			ship.Crew = append(ship.Crew[:i], ship.Crew[i+1:]...)
			break
		}
	}
}

func (p *Player) pilot(ship *Ship) {
	if p.Controls == "pilot" {
		return
	}
	if time.Since(p.rateLimits.pilot) < interractRateLimit*time.Millisecond {
		return
	}
	p.rateLimits.pilot = time.Now()
	ship.Pilot = p
	p.Controls = "pilot"
	p.Angle = ship.Angle
	p.Velocity = 0 // so you don't overshoot the steering wheel
}

func (p *Player) unPilot(ship *Ship) {
	if p.Controls != "pilot" {
		return
	}
	if time.Since(p.rateLimits.pilot) < interractRateLimit*time.Millisecond {
		return
	}
	p.rateLimits.pilot = time.Now()
	ship.Pilot = nil
	p.Controls = "walk"
}

func (p *Player) crowsNest(ship *Ship) {
	if p.Controls == "crowsNest" {
		return
	}
	if time.Since(p.rateLimits.crowsNest) < interractRateLimit*time.Millisecond {
		return
	}
	p.Velocity = 0
	p.rateLimits.crowsNest = time.Now()
	ship.CrowsNest = p
	p.Controls = "crowsNest"
}

func (p *Player) unCrowsNest(ship *Ship) {
	if p.Controls != "crowsNest" {
		return
	}
	if time.Since(p.rateLimits.crowsNest) < interractRateLimit*time.Millisecond {
		return
	}
	p.rateLimits.crowsNest = time.Now()
	ship.CrowsNest = nil
	p.Controls = "walk"
}

func (p *Player) update() {
	const tickRate = 120 // ticks per second
	t := time.NewTicker((1000 / tickRate) * time.Millisecond)

	for {
		<-t.C
		vel := p.Velocity

		newX := p.X + int64(float64(vel)*math.Cos(p.Angle*math.Pi/180)/float64(tickRate))
		newY := p.Y + int64(float64(vel)*-math.Sin(p.Angle*math.Pi/180)/float64(tickRate))
		if newX < 0 || newX > maxDimension || newY < 0 || newY > maxDimension {
			// player is out of bounds, so stop them
			p.Velocity = 0

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

		p.X = newX
		p.Y = newY

		if time.Since(p.lastAccelerate) > playerDecayGracePeriodMS*time.Millisecond {
			// decay velocity
			decay := 0.93
			p.Velocity = int64(float64(p.Velocity) * decay)
		}
	}
}
