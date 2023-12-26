import kaboom from "kaboom"
const k = kaboom()

k.setBackground(k.BLACK)	

// fixed text bottom right
const debug = k.add([
	k.text("Hello world!", {size: 10}),
	k.pos(k.width() - 10, k.height() - 10),
	k.anchor("botright"),
	k.fixed(),
])



class Map {
	constructor() {
		this.map = k.add([
			k.rect(300, 50),
			k.pos(k.width()/2, 10),
			k.body({mass: 1000}),
			k.area(),
		])

	}
}
class Player {
    constructor() {
		this.player = k.add([
            k.pos(k.width()/2, k.height()/2),
			k.anchor("center"),
			k.area(),
			k.circle(20),
			k.body({mass: 1, }),
        ])
		
		this.velocity = 0
		this.angle = 0
        
        this.setupControls()
    }

    update() {
		k.camPos(this.player.pos)

		this.player.move(
			this.velocity * Math.sin(-this.angle * Math.PI / 180), 
			this.velocity * Math.cos(-this.angle * Math.PI / 180)
		)

		// decrease velocity
		this.velocity *= 0.93
		if (this.velocity < 10 && this.velocity > -10) {
			this.velocity = 0
		}
    }

    // Method to setup controls
    setupControls() {
		const rotateSpeed = 3
        k.onKeyDown("a", () => {
			this.angle -= rotateSpeed
			k.camRot(0 - this.angle)
			this.player.angle = this.angle
		})
        k.onKeyDown("d", () => {
			this.angle += rotateSpeed
			k.camRot(0 - this.angle)
			this.player.angle = this.angle
		})
		
        k.onKeyDown("w", () => {
			this.velocity = -300
		})
        k.onKeyDown("s", () => {
			this.velocity = 300
		})
    }
}
// Create a new Player instance
const myPlayer = new Player()
const map = new Map()

// Update loop
k.onUpdate(() => {
	myPlayer.update()

	// debug player position angle and velocity
	debug.text = `x: ${myPlayer.player.pos.x.toFixed(2)} y: ${myPlayer.player.pos.y.toFixed(2)} angle: ${myPlayer.angle.toFixed(2)} velocity: ${myPlayer.velocity.toFixed(2)}`
})