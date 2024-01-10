package main

import (
	"math"
	"time"
)

const PlayerMaxVelocity = 5000 // 5 meters per second
const PlayerTurnSpeed = 3      // 3 degrees per tick

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
