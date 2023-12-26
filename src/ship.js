import k from './main.js'
// units are centimeters / second

const shipWidth = 200
const shipLength = 300
const velocityDecay = 0.98

export default class Ship {
	constructor() {
        this.ship = k.add([
            k.pos(200, 200),
            k.polygon([
                k.vec2(0, shipLength * .3),
                k.vec2(shipWidth / 2, 0),
                k.vec2(shipWidth, shipLength * .3), 
                k.vec2(shipWidth, shipLength), 
                k.vec2(0,shipLength)
            ]),
            k.area(),
            "ship"
        ])

        this.ship.add([
            k.pos(shipWidth / 2, shipLength - 50),
            k.rect(50, 50),
            k.color(200, 0, 0),
            k.area(),
			k.anchor("center"),
            "captainSeat"
        ])

        // add parent to custom object so we can access it from other objects
        this.ship.parent = this

        this.velocity = 0
        this.angle = 0
	}

    setVelocity(velocity) {
        this.velocity = velocity
    }

    update() {
        this.ship.move(this.velocity, 0)

		// decrease velocity
		this.velocity *= velocityDecay
		if (this.velocity < 10 && this.velocity > -10) {
			this.velocity = 0
		}
    }
}