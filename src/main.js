import kaboom from "kaboom"
import Map from "./map.js"
import Player from "./player.js"

const k = kaboom()
k.setBackground(k.BLACK)
export default k
	

// fixed text bottom right
const debug = k.add([
	k.text("Hello world!", {size: 10}),
	k.pos(k.width() - 10, k.height() - 10),
	k.anchor("botright"),
	k.fixed(),
])


const myPlayer = new Player()
const map = new Map()

// Update loop
k.onUpdate(() => {
	myPlayer.update()

	// debug player position angle and velocity
	debug.text = `x: ${myPlayer.player.pos.x.toFixed(2)} y: ${myPlayer.player.pos.y.toFixed(2)} angle: ${myPlayer.angle.toFixed(2)} velocity: ${myPlayer.velocity.toFixed(2)}`
})