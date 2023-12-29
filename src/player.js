import k from "./main.js"

const width = 40
const forwardAcceleration = 50
const maxForwardVelocity = 400
const reverseAcceleration = 50
const maxReverseVelocity = 200
const velocityDecay = 0.93

export default class Player {
    constructor() {
		this.player = k.add([
            k.pos(k.width()/2-50, k.height()*1/4),
			k.anchor("center"),
            k.circle(width/2),
            k.color(k.WHITE),
			k.area(),
			k.body({mass: 1, }),
            "player"
        ])

        this.player.collisionIgnore = ["shipBody", "shipBow", "island"]
		
        // movement
		this.velocity = 0
		this.angle = 0
        this.setupControls()

        // interaction
        this.mode = "walk" // walk, drive
        this.vehicle = null // vehicle object, for player to enter/exit/drive
        this.setupShipControls()
    }

    update() {
        // move relative to ship deck
        if (this.vehicle != null) {
            const {x, y} = this.vehicle.getVelocity()
            this.player.move(x, y)
        }

        if (this.mode == "walk") {
            k.camPos(this.player.pos)
            const {x, y} = this.getVelocity()
            this.player.move(x, y)

            // decrease velocity
            this.velocity *= velocityDecay
            if (this.velocity < 10 && this.velocity > -10) {
                this.velocity = 0
            }
        }
        else if (this.mode == "drive") {
            k.camScale(.2)
            k.camPos(this.vehicle.ship.pos)
            k.camRot(0 - this.vehicle.angle)
        }
    }

    // Method to setup controls
    setupControls() {
		const rotateSpeed = 3
        k.onKeyDown("a", () => {
            if (this.mode === "walk") {
                this.angle -= rotateSpeed
                k.camRot(0 - this.angle)
                this.player.angle = this.angle
            } else if (this.mode === "drive") {
                this.vehicle.left()
            }
		})
        k.onKeyDown("d", () => {
            if (this.mode === "walk") {
                this.angle += rotateSpeed
                k.camRot(0 - this.angle)
                this.player.angle = this.angle
            } else if (this.mode === "drive") {
                this.vehicle.right()
            }
		})
		
        k.onKeyDown("w", () => {
            if (this.mode === "walk") {
                this.velocity += forwardAcceleration
                if (this.velocity > maxForwardVelocity) {
                    this.velocity = maxForwardVelocity
                }
            } else if (this.mode === "drive") {
                this.vehicle.accelerate()
            }
		})
        k.onKeyDown("s", () => {
            if (this.mode === "walk") {
                this.velocity -= reverseAcceleration
                if (this.velocity < -maxReverseVelocity) {
                    this.velocity = -maxReverseVelocity
                }
            }
		})
    }

    setupShipControls() {

        // enter/exit vehicle
        this.player.onCollide("shipDeck", (d) => {
            this.vehicle = d.parent.parentObj
        })

        this.player.onCollideEnd("shipDeck", (d) => {
            this.vehicle = null
        })

        this.player.onCollide("shipWheel", (v) => {
            if (this.mode == "walk") {
                this.mode = "drive"
            }
        })

        k.onKeyDown("e", () => {
            if (this.mode == "drive") {
                this.mode = "walk"
                this.angle = this.vehicle.angle
                k.camScale(1)
            }
        })
    }

    getVelocity() {
        const x = -this.velocity * Math.sin(-this.angle * Math.PI / 180)
        const y = -this.velocity * Math.cos(-this.angle * Math.PI / 180)
        return {x, y}
    }
}