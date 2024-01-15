import k from './main.js'
import { sendDataToServer, localState } from './socket';


export const createPlayer = (id, main, x, y) => {
	// create a new player
	const p = k.add([
		k.circle(500),
		k.pos(x, y),
		k.anchor("center"),
		k.z(3),
		k.area(),
		"player", // shared tag
		id, // unique tag
	])

    // ignore non-main players
	if (!main) {
        return
    }

    const controlHint = k.add([
        k.text("WASD to move"),
        k.pos(k.width()/2, k.height()/2 + 50),
        k.anchor("center"),
        k.scale(0.5),
        k.z(10),
        k.fixed(),
    ])

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
        controlHint.hidden = false
        controlHint.text = "" // will be updated in p.onUpdate()
    })
    p.onCollideEnd("pilot", (pilot) => {
        p._interact = null
        controlHint.hidden = true
    })

    // claiming crow's nest
    p.onCollide("crowsNest", (crowsNest) => {
        p._interact = "crowsNest"
        controlHint.hidden = false
        controlHint.text = "" // will be updated in p.onUpdate()
    })
    p.onCollideEnd("crowsNest", (crowsNest) => {
        p._interact = null
        controlHint.hidden = true
    })

    k.onKeyDown('w', () => {
        if (controlHint.text == "WASD to move") {
            controlHint.hidden = true
        }
        sendDataToServer('w');
    });
    
    k.onKeyDown('a', () => {
        sendDataToServer('a');
    });
    
    k.onKeyDown('s', () => {
        sendDataToServer('s');
    });
    
    k.onKeyDown('d', () => {
        sendDataToServer('d');
    });

    p.onKeyDown('e', () => {
        if (p._interact === "pilot") {
            sendDataToServer('e:pilot') // pilot current ship if possible
        }
        if (localState.thisPlayer.controls === "pilot") {
            sendDataToServer('e:unPilot') // unPilot current ship if possible
        }
        if (p._interact === "crowsNest") {
            sendDataToServer('e:crowsNest') // crowsNest current ship if possible
        }
        if (localState.thisPlayer.controls === "crowsNest") {
            sendDataToServer('e:unCrowsNest') // unCrowsNest current ship if possible
        }
    });

    p.onUpdate(() => {
        if (localState.thisPlayer.controls === "pilot" && p._interact === "pilot") {
            controlHint.hidden = false
            controlHint.text = "WASD to steer, E to walk"
        }
        if (localState.thisPlayer.controls !== "pilot" && p._interact === "pilot") {
            controlHint.hidden = false
            controlHint.text = "E to pilot"
        }
        if (localState.thisPlayer.controls === "crowsNest" && p._interact === "crowsNest") {
            controlHint.hidden = false
            controlHint.text = "WASD to look around, E to climb down"
        }
        if (localState.thisPlayer.controls !== "crowsNest" && p._interact === "crowsNest") {
            controlHint.hidden = false
            controlHint.text = "E to climb"
        }
    })

	return
}