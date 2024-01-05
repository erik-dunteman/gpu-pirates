import kaboom from "kaboom"
import { connectToServer, sendDataToServer, localState } from './socket';

const k = kaboom()

k.loadSprite("bean", "sprites/bean.png")

k.setBackground(k.BLACK)
k.add([
	k.text("Hello, world!"),
])

const createPlayer = (id, main, x, y) => {
	// create a new player
	const p = k.add([
		k.circle(50),
		k.pos(x, y),
		k.anchor("center"),
		k.z(2),
		"player", // shared tag
		id, // unique tag
	])
	p.add([
		k.rect(10000, 10000),
		k.color(k.BLUE),
		k.opacity(0.3),
		k.anchor("center"),
		k.z(1),
	])

	// if this is the main player, follow with cam
	if (main) {
		k.onUpdate(() => {
			k.camPos(p.pos)
		})
	}

	return
}

const movePlayer = (player, x, y) => {
	player.moveTo(k.vec2(x, y))
}

k.onUpdate(() => {
	
	// update other players
	for (const playerID in localState.players) {
		// find the player if it exists
		const playerMatches = k.get(playerID)
		if (playerMatches.length === 0) {
			createPlayer(playerID, false, localState.players[playerID].x, localState.players[playerID].y)
			continue
		}
		const playerObj = playerMatches[0]
		movePlayer(playerObj, localState.players[playerID].x, localState.players[playerID].y)
	}

	// update this player
	if (localState.thisPlayer) {
		const playerMatches = k.get(localState.thisPlayer.id)
		if (playerMatches.length === 0) {
			createPlayer(localState.thisPlayer.id, true, localState.thisPlayer.x, localState.thisPlayer.y)
		} else {
			playerObj = playerMatches[0]
			movePlayer(playerObj, localState.thisPlayer.x, localState.thisPlayer.y)
		}
	}

	// remove players that no longer exist
	for (const player of k.get("player")) {
		// get all keys in localState.players
		const playerIDs = Object.keys(localState.players)
		// append thisPlayer.id if it exists
		if (localState.thisPlayer) {
			playerIDs.push(localState.thisPlayer.id)
		}

		// if the player doesn't exist in localState.players, remove it
		let found = false
		for (const playerID of playerIDs) {
			if (player.is(playerID)) {
				found = true
			}
		}
		if (!found) {
			player.destroy()
		}
	}
})

// Example key bindings
k.onKeyDown('w', () => {
  // Send 'w' to the server when the 'w' key is pressed
  sendDataToServer('w');
});

k.onKeyDown('a', () => {
  // Send 'a' to the server when the 'a' key is pressed
  sendDataToServer('a');
});

k.onKeyDown('s', () => {
  // Send 's' to the server when the 's' key is pressed
  sendDataToServer('s');
});

k.onKeyDown('d', () => {
  // Send 'd' to the server when the 'd' key is pressed
  sendDataToServer('d');
});

// Connect to the server when the page loads (you can call this function at an appropriate time)
connectToServer();
