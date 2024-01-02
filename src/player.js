import k from "./main.js"

const width = 40
const forwardAcceleration = 50
const maxForwardVelocity = 400
const reverseAcceleration = 50
const maxReverseVelocity = 200
const velocityDecay = 0.93
const swimVelocityDecay = 0.8
const swimVelocityFactor = 0.3

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

        this.player.collisionIgnore = ["shipBody", "shipBow", "islandBody"]
		
        // movement
		this.velocity = 0
		this.angle = 0
        this.setupControls()

        // interaction
        this.activeCollisions = []

        this.mode = "walk" // walk, swim, drive
        this.vehicle = null // vehicle object, for player to enter/exit/drive
        this.setupShipControls()
        this.setupIslandControls()
    }


    update() {

        // clean up state from collisions that have ended
        let walkingSurfaces = false
        let vehicles = false
        for (let i = 0; i < this.activeCollisions.length; i++) {
            if (this.activeCollisions[i] == "shipDeck") {
                walkingSurfaces = true
                vehicles = true
            }
            if (this.activeCollisions[i] == "island") {
                walkingSurfaces = true
            }
        }
        if (!walkingSurfaces) {
            this.mode = "swim"
        } else if (walkingSurfaces && this.mode !== "drive") {
            this.mode = "walk"
        }
        if (!vehicles) {
            this.vehicle = null
        }

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

        if (this.mode == "swim") {
            k.camPos(this.player.pos)
            const {x, y} = this.getVelocity()
            this.player.move(x * swimVelocityFactor, y * swimVelocityFactor)

            // decrease velocity
            this.velocity *= swimVelocityDecay // faster decay
            if (this.velocity < 10 && this.velocity > -10) {
                this.velocity = 0
            }
        }
       
        else if (this.mode == "drive" && this.vehicle != null) {
            k.camScale(.2)

            // show player in driver seat
            this.vehicle.captainPlayerIcon.hidden = false
            this.player.hidden = true
            this.player.pos = this.vehicle.ship.pos

            k.camPos(this.vehicle.ship.pos)
            k.camRot(0 - this.vehicle.angle)
        }
    }

    // Method to setup controls
    setupControls() {
		const rotateSpeed = 3
        k.onKeyDown("a", () => {
            if (this.mode === "walk" || this.mode === "swim") {
                this.angle -= rotateSpeed
                k.camRot(0 - this.angle)
                this.player.angle = this.angle
            } else if (this.mode === "drive" && this.vehicle != null) {
                this.vehicle.left()
            }
		})
        k.onKeyDown("d", () => {
            if (this.mode === "walk" || this.mode === "swim") {
                this.angle += rotateSpeed
                k.camRot(0 - this.angle)
                this.player.angle = this.angle
            } else if (this.mode === "drive" && this.vehicle != null) {
                this.vehicle.right()
            }
		})
		
        k.onKeyDown("w", () => {
            if (this.mode === "walk" || this.mode === "swim") {
                this.velocity += forwardAcceleration
                if (this.velocity > maxForwardVelocity) {
                    this.velocity = maxForwardVelocity
                }
            } else if (this.mode === "drive" && this.vehicle != null) {
                this.vehicle.accelerate()
            }
		})
        k.onKeyDown("s", () => {
            if (this.mode === "walk" || this.mode === "swim") {
                this.velocity -= reverseAcceleration
                if (this.velocity < -maxReverseVelocity) {
                    this.velocity = -maxReverseVelocity
                }
            }
		})
    }

    setupIslandControls() {
        this.player.onCollide("island", (d) => {
            this.activeCollisions.push("island")
        })
        this.player.onCollideEnd("island", (d) => {
            this.activeCollisions.splice(this.activeCollisions.indexOf("island"), 1)
        })
    }


    setupShipControls() {
        // enter/exit vehicle
        this.player.onCollide("shipDeck", (d) => {
            this.activeCollisions.push("shipDeck")
            this.vehicle = d.parent.parentObj
        })

        this.player.onCollideEnd("shipDeck", (d) => {
            // pop single "shipDeck" from activeCollisions
            this.activeCollisions.splice(this.activeCollisions.indexOf("shipDeck"), 1)

            // wait for update loop to terminate vehicle, 
            // since there could be multiple collisions
        })

        this.player.onCollide("shipWheel", (v) => {
            if (this.mode == "walk") {
                this.mode = "drive"
            }
        })

        k.onKeyDown("q", () => {
            if (this.mode == "drive") {
                this.mode = "walk"
                this.angle = this.vehicle.angle

                // reveal player, hide captainPlayerIcon
                this.vehicle.captainPlayerIcon.hidden = true
                this.player.hidden = false
                this.velocity = 0
                k.camScale(1)
            }
        })

        k.onKeyDown("e", () => {
            if (this.mode == "drive") {
                // this.vehicle.fire()
            }
        })
    }

    getVelocity() {
        const x = -this.velocity * Math.sin(-this.angle * Math.PI / 180)
        const y = -this.velocity * Math.cos(-this.angle * Math.PI / 180)
        return {x, y}
    }
}