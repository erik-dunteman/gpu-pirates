import k from './main.js'
// units are centimeters / second

const shipWidth = 450
const shipLength = 1000
const shipMass = 100

const shipHP = 2

const forwardAcceleration = .5
const drag = .2
const maxForwardVelocity = 5000
const turnSpeed = 0.5


const railWidth = 10
const railColor = {r: 79, g: 43, b:0}
const deckColor = {r: 122, g: 69, b:5}

export default class Ship {
	constructor(x, y, angle=0) {

        // generate id
        this.id = Math.random().toString(36).substring(7)

        // add the ship body, a rectangle
        this.ship = k.add([
            k.pos(x, y),
            k.rect(shipWidth, shipLength * .8),
            k.color(k.RED),
            k.area(),
            k.body({mass:shipMass}),
            k.anchor("center"),
            k.rotate(angle),
            "shipBody"
        ])

        // add hit points to the ship
        this.hp = shipHP

        // add bow
        const bow = this.ship.add([
            k.pos(-shipWidth * .5, -shipLength * .6),
            k.polygon([
                k.vec2(0, shipLength * .2),
                k.vec2(shipWidth / 2, 0),
                k.vec2(shipWidth, shipLength * .2),
            ]),
            k.color(k.BLUE),
            k.area(),
            k.body({isStatic:true}),
            "shipBow"
        ])

        this.ship.collisionIgnore = ["shipRail"] // make sure the ship doesn't collide with its own rails
        bow.collisionIgnore = ["shipRail"]

        bow.onCollide("shipBody", (targetShip) => {
            // ignore collision with self
            if (targetShip.id == bow.parent.id) {
                return
            }
            console.log("collided with other ship body", targetShip.id)
            // sum the velocities of the two ships to measure impact
            const targetVel = targetShip.parentObj.getVelocity()
            const thisVel = this.getVelocity()
            const impactVelocity = Math.sqrt(Math.pow(targetVel.x-thisVel.x, 2) + Math.pow(targetVel.y-thisVel.y, 2))

            // damage the ship based on impact velocity
            targetShip.parentObj.hp -= impactVelocity / 100
        })

        // register parent so we can access it from collision events
        this.ship.parentObj = this

        // add the deck, which is a sensor for the player to walk on
        this.ship.add([
            k.pos(-shipWidth * .5, -shipLength * .6),
            k.polygon([
                k.vec2(shipWidth, shipLength), 
                k.vec2(0, shipLength),
                k.vec2(0, shipLength * .2),
                k.vec2(shipWidth / 2, 0),
                k.vec2(shipWidth, shipLength * .2),
            ]),
            k.color(k.rgb(deckColor.r, deckColor.g, deckColor.b)),
            k.area(),
            k.anchor("center"),
            "shipDeck"
        ])

        // add rails with collision
        this.ship.add([
            k.pos(-shipWidth * .5, -shipLength * .6),
            k.polygon([
                k.vec2(0, shipLength * .2),
                k.vec2(shipWidth / 2, 0),
                k.vec2(shipWidth / 2, 10),
                k.vec2(10, shipLength * .2),
            ]),  
            k.color(k.rgb(railColor.r, railColor.g, railColor.b)),
            k.area(),
            k.body({isStatic:true}),
            "shipRail"
        ])
        this.ship.add([
            k.pos(-shipWidth * .5, -shipLength * .6),
            k.polygon([
                k.vec2(shipWidth, shipLength * .2),
                k.vec2(shipWidth / 2, 0),
                k.vec2(shipWidth / 2, 10),
                k.vec2(shipWidth-10, shipLength * .2),
            ]),
            k.color(k.rgb(railColor.r, railColor.g, railColor.b)),
            k.area(),
            k.body({isStatic:true}),
            "shipRail"
        ])
        this.ship.add([
            k.pos(-shipWidth * .5, -shipLength * .4),
            k.rect(10, shipLength*.2),
            k.color(k.rgb(railColor.r, railColor.g, railColor.b)),
            k.area(),
            k.body({isStatic:true}),
            "shipRail"
        ])
        this.ship.add([
            k.pos(-shipWidth * .5, shipLength * .4 -10),
            k.anchor("botleft"),
            k.rect(10, shipLength*.4 - 10),
            k.color(k.rgb(railColor.r, railColor.g, railColor.b)),
            k.area(),
            k.body({isStatic:true}),
            "shipRail"
        ])
        this.ship.add([
            k.pos(-shipWidth * .5, shipLength * .4),
            k.anchor("botleft"),
            k.rect(shipWidth, 10),
            k.color(k.rgb(railColor.r, railColor.g, railColor.b)),
            k.area(),
            k.body({isStatic:true}),
            "shipRail"
        ])
        this.ship.add([
            k.pos(shipWidth * .5, shipLength * .4 - 10),
            k.anchor("botright"),
            k.rect(10, shipLength*.4 - 10),
            k.color(k.rgb(railColor.r, railColor.g, railColor.b)),
            k.area(),
            k.body({isStatic:true}),
            "shipRail"
        ])
        this.ship.add([
            k.pos(shipWidth * .5, -shipLength*.4),
            k.anchor("topright"),
            k.rect(10, shipLength*.2),
            k.color(k.rgb(railColor.r, railColor.g, railColor.b)),
            k.area(),
            k.body({isStatic:true}),
            "shipRail"
        ]) 

        // add sails
        // mast
        this.ship.add([
            k.pos(0, -shipLength * .1 + 35),
            k.circle(30),
            k.color(k.rgb(railColor.r, railColor.g, railColor.b)),
            k.anchor("center"),
            "shipSail"
        ])
        // sail
        this.ship.add([
            k.pos(0, -shipLength * .1),
            k.rect(shipWidth * 1.6, 40),
            k.color(k.rgb(200, 200, 200)),
            k.anchor("center"),
            "shipSail"
        ])
        // cross beam
        this.ship.add([
            k.pos(0, -shipLength * .1 + 20),
            k.rect(shipWidth * 1.2 , 10),
            k.color(k.rgb(railColor.r, railColor.g, railColor.b)),
            k.anchor("center"),
            "shipSail"
        ])


        // add the captain's spot
        const captainSpot = this.ship.add([
            k.pos(0, shipLength / 6 - 20),
            k.rect(100, 20),
            k.color(k.rgb(railColor.r, railColor.g, railColor.b)),
            k.area(),
            k.body({isStatic:true}),
            k.anchor("center"),
            "shipRail"
        ])
        this.ship.add([
            k.pos(0, shipLength / 6),
            k.rect(50, 10),
            k.color(200, 0, 0),
            k.area(),
			k.anchor("center"),
            "shipWheel"
        ])


        this.velocity = 0
        this.angle = 0

        k.onCollide("shipRail", "island", (ship, map) => {
            ship.parent.parentObj.velocity = 0
        })
        k.onCollide("shipBow", "island", (ship, map) => {
            ship.parent.parentObj.velocity = 0
        })
        k.onCollide("shipBody", "island", (ship, map) => {
            ship.parentObj.velocity = 0
        })
	}

    
    getVelocity() {
        const x = -this.velocity * Math.sin(-this.angle * Math.PI / 180)
        const y = -this.velocity * Math.cos(-this.angle * Math.PI / 180)
        return {x, y}
    }

    accelerate() {
        this.velocity += forwardAcceleration
        if (this.velocity > maxForwardVelocity) {
            this.velocity = maxForwardVelocity
        }
    }

    right() {
        this.angle += turnSpeed
    }

    left() {
        this.angle -= turnSpeed
    }
    

    getDriverView() {
        console.log(this.ship.children)
        return this.ship.pos
    }

    update() {
        // destroy ship if hp is 0
        if (this.hp <= 0) {
            this.ship.destroy()
        }

        // move
        const {x, y} = this.getVelocity()
        this.ship.move(x, y)

        // this.angle -= 2
        
        // ship rotates about top left corner, so we need to translate the angle while rotating to make it rotate about the center

        // Apply rotation
        this.ship.angle = this.angle;

        // // Ship radius
        // const r = Math.sqrt(Math.pow(shipLength, 2) + Math.pow(shipWidth, 2))
        // console.log(r)
        // const alignedAngle = Math.atan(shipLength / shipWidth) * 180 / Math.PI

        // // Apply translation
        // const new_y = r / Math.sqrt(Math.tan(alignedAngle + (this.angle * Math.PI / 180) + 1))
        // const new_x = Math.sqrt(Math.pow(r, 2) / Math.pow(new_y, 2))
        // // console.log(new_x, new_y)
        

		// decrease velocity
        if (this.velocity > drag) { 
            this.velocity -= drag
        }
    }
}