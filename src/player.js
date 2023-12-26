import k from "./main.js"

const width = 40
const forwardAcceleration = 50
const maxForwardVelocity = 400
const reverseAcceleration = 50
const maxReverseVelocity = 200
const velocityDecay = 0.93

export default class Player {
    constructor() {
		this.player = add([
            k.pos(k.width()/2, k.height()/2),
			k.anchor("center"),
            k.circle(width/2),
            k.color(0, 0, 255),
			k.area(),
			k.body({mass: 1, }),
            "player"
        ])
		
        // movement
		this.velocity = 0
		this.angle = 0
        this.setupControls()

        // interaction
        this.mode = "walk" // walk, drive
        this.vehicle = null // vehicle object, for player to enter/exit/drive
        this.setupPilotControls()
    }

    update() {
		k.camPos(this.player.pos)

		this.player.move(
			-this.velocity * Math.sin(-this.angle * Math.PI / 180), 
			-this.velocity * Math.cos(-this.angle * Math.PI / 180)
		)

		// decrease velocity
		this.velocity *= velocityDecay
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
			this.velocity += forwardAcceleration
            if (this.velocity > maxForwardVelocity) {
                this.velocity = maxForwardVelocity
            }
		})
        k.onKeyDown("s", () => {
            this.velocity -= reverseAcceleration
            if (this.velocity < -maxReverseVelocity) {
                this.velocity = -maxReverseVelocity
            }
		})
    }

    setupPilotControls() {
        this.player.onCollide("ship", (v) => {
            if (this.mode == "walk") {
                console.log(v)
                this.vehicle = v.parentObj
                this.mode = "drive"
                this.vehicle.setVelocity(1000)
            }
        })
    }
}