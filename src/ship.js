import k from './main.js'
// units are centimeters / second

const shipWidth = 150
const shipLength = 300
const velocityDecay = 0.98

export default class Ship {
	constructor() {
		// this.ship = k.add([
		// 	k.rect(shipWidth, shipLength),
		// 	k.pos(200, 200),
		// 	k.body({mass: 10000}),
		// 	k.area(),
		// ])

        this.ship = k.add([
            pos(200, 200),
            polygon([
                vec2(0,0),
                vec2(50, -50),
                vec2(100,0), 
                vec2(100,200), 
                vec2(0,200)
            ]),
            area(),
            "ship"
        ])

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