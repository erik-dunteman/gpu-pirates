import kaboom from "kaboom"
import Map from "./map.js"
import Player from "./player.js"
import Ship from "./ship.js"

const k = kaboom()
export default k

const map = new Map()
const ship = new Ship(50, 300, 0)
const ship2 = new Ship(-1200, 300, 0)
const myPlayer = new Player()

// Update loop
k.onUpdate(() => {
	myPlayer.update()
	ship.update()
	// debug player position angle and velocity
	debug.text = `${myPlayer.vehicle?.velocity}`
})

k.camScale(1)

// k.debug.inspect =s true
// k.debug.showLog = true