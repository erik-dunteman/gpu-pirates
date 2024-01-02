import kaboom from "kaboom"
import Map from "./map.js"
import Player from "./player.js"
import Ship from "./ship.js"

const k = kaboom()
export default k

const map = new Map()
const ship = new Ship(50, 300, 0)
const ship2 = new Ship(-1200, 300, 10)
const myPlayer = new Player()

// debug text
debug = k.add([
    k.text(`${ship.hp} ${ship2.hp}`),
    k.pos(24, 24),
	k.fixed(),
    // { value: text },
])

// loop
k.onUpdate(() => {
	myPlayer.update()
	ship.update()
	ship2?.update()
	// debug player position angle and velocity
	debug.text = `${ship.hp} ${ship2.hp}`
})



k.camScale(1)

// k.debug.inspect = true
// k.debug.showLog = true