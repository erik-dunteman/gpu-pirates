import k from './main.js'
import { sendDataToServer, localState } from './socket';


export const createPlayer = (id, main, x, y) => {
	// create a new player
	const p = k.add([
		k.circle(500),
		k.pos(x, y),
		k.anchor("center"),
		k.z(2),
		k.area(),
		"player", // shared tag
		id, // unique tag
	])

    // ignore non-main players
	if (!main) {
        return
    }

    // add interractions
    p._interact = null

    // ship boarding/unboarding
    p.onCollide("ship", (s) => {
        for (shipID in localState.ships) {
            if (s.is(shipID)) {
                console.log("boarding", shipID)
                sendDataToServer("board:" + shipID)
            }
        }
    })
    p.onCollideEnd("ship", (s) => {
        for (shipID in localState.ships) {
            if (s.is(shipID)) {
                console.log("unboarding", shipID)
                sendDataToServer("unboard:" + shipID)
            }
        }
    })

    // claiming pilot spot
    p.onCollide("pilot", (pilot) => {
        p._interact = "pilot"
    })
    p.onCollideEnd("pilot", (pilot) => {
        p._interact = null
    })

    p.onKeyDown('e', () => {
        if (p._interact === "pilot") {
            sendDataToServer('e:pilot') // pilot current ship if possible
        }
    });

	// fog of war, for debug
	// p.add([
	// 	k.rect(200_000, 200_000),
	// 	k.color(k.RED),
	// 	k.opacity(0.3),
	// 	k.anchor("center"),
	// 	k.z(1),
	// ])

	return
}