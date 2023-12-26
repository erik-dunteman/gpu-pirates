import kaboom from "kaboom"
import Map from "./map.js"
import Player from "./player.js"
import Ship from "./ship.js"

const k = kaboom()
k.setBackground(k.BLACK)
export default k


// fixed text bottom right
const debug = k.add([
	k.text("Hello world!", {size: 30}),
	k.pos(k.width() - 10, k.height() - 10),
	k.anchor("botright"),
	k.fixed(),
])

const map = new Map()
const ship = new Ship()
const myPlayer = new Player()

// Update loop
k.onUpdate(() => {
	myPlayer.update()
	ship.update()


	// debug player position angle and velocity
	debug.text = `mode: ${myPlayer.mode}`
})

k.debug.inspect = true
k.debug.showLog = true