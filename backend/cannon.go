package main

import (
	"math"
	"time"

	"github.com/google/uuid"
)

type Cannon struct {
	ID        string  `json:"id"`
	Side      string  `json:"side"`
	Angle     float64 `json:"angle"`
	Pos       int64   `json:"pos"`
	Operator  *Player `json:"operator"`
	rateLimit time.Time
}

const CannonBallVelocity = 15_000
const CannonBallDamage = 10
const CannonBallLifetime = 2_000

func (c *Cannon) fire() {
	if time.Since(c.rateLimit) < interractRateLimit*time.Millisecond {
		return
	}
	c.rateLimit = time.Now()
	cannonID := uuid.New().String()

	// calculate center of cannon, to spawn ball there

	// relative to ship center
	relXOffset := float64(shipWidth * shipScale / 2)
	if c.Side == "left" {
		relXOffset *= -1
	}
	relYOffset := float64(c.Pos)

	// rotate that radius by ship.Angle about ship origin
	ship := globalState.Ships[c.Operator.ShipID]
	rad := math.Sqrt(math.Pow(relXOffset, 2) + math.Pow(relYOffset, 2))
	relAngle := math.Atan2(relYOffset, relXOffset) * 180 / math.Pi
	actualAngle := relAngle + ship.Angle + 90

	// update relXOffset, relYOffset to be rotated by ship.Angle
	relXOffset = rad * math.Cos(actualAngle*math.Pi/180)
	relYOffset = rad * -math.Sin(actualAngle*math.Pi/180)

	ball := &CannonBall{
		ID:       cannonID,
		ShipID:   ship.ID,
		X:        ship.X + int64(relXOffset),
		Y:        ship.Y + int64(relYOffset),
		Velocity: CannonBallVelocity,
		Angle:    c.Angle}
	// TODO: make ball velocity relative to ship velocity and angle

	// we need to add the ball to the global state, but we can't do that from this goroutine
	// so we send a request to the state manager to do it for us
	mutateRequest := func(innerState GlobalState) GlobalState {
		innerState.CannonBalls[cannonID] = ball
		go ball.update()
		return innerState
	}
	ScheduleMutation(mutateRequest)
}

type CannonBall struct {
	ID       string  `json:"id"`
	X        int64   `json:"x"`
	Y        int64   `json:"y"`
	Velocity int64   `json:"velocity"`
	Angle    float64 `json:"angle"`
	ShipID   string  `json:"shipID"` // origin ship
}

func (c *CannonBall) update() {
	destroyChan := time.After(CannonBallLifetime * time.Millisecond)

	const tickRate = 120 // ticks per second
	t := time.NewTicker((1000 / tickRate) * time.Millisecond)
	for {
		select {
		case <-destroyChan:
			mutateRequest := func(innerState GlobalState) GlobalState {
				delete(innerState.CannonBalls, c.ID)
				return innerState
			}
			ScheduleMutation(mutateRequest)
			// we need to stop the ticker
			t.Stop()
			return
		case <-t.C:
			vel := c.Velocity
			c.X += int64(float64(vel) * math.Cos(c.Angle*math.Pi/180) / float64(tickRate))
			c.Y += int64(float64(vel) * -math.Sin(c.Angle*math.Pi/180) / float64(tickRate))
		}
	}
}
