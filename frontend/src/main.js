import kaboom from "kaboom"
import { connectToServer, sendDataToServer, localState } from './socket';

const k = kaboom()

k.loadSprite("bean", "sprites/bean.png")
k.loadSprite("compass", "sprites/compass.png")

k.setBackground(k.BLACK)

// add game water
k.add([
	k.rect(1_000_000, 1_000_000),
	k.color(k.BLUE),
	k.pos(0, 0),
])

const updateCompass = () => {
	const compass = k.get("compass")
	if (compass.length === 0) {
		k.add([
			k.sprite("compass"),
			k.pos(k.width() - 100, 100),
			k.fixed(),
			k.anchor("center"),
			k.scale(0.5),
			k.z(3),
			"compass",
		])
		return
	}
	const compassObj = compass[0]
	compassObj.angle = localState.thisPlayer.angle + 90
}


const createPlayer = (id, main, x, y) => {
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

const createIsland = (island) => {
	// create a new island
	const vertices = []
	for (const vertex of island.vertices) {
		vertices.push(k.vec2(vertex.x, vertex.y))
	}
	k.add([
		k.polygon(vertices),
		k.color(k.GREEN),
		k.anchor("center"),
		k.z(0),
		"island", // shared tag
		island.ID, // unique tag
	])
}

const movePlayer = (player, x, y, camFollow) => {
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
			
			k.camScale(0.05)
			k.camPos(playerObj.pos)
			k.camRot(-90 + localState.thisPlayer.angle)
			updateCompass()
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

	// add islands
	for (const islandID in localState.islands) {
		const islandMatches = k.get(islandID)
		if (islandMatches.length === 0) {
			createIsland(localState.islands[islandID])
			continue
		}
	}
	// remove islands that are no longer in localState.islands
	for (const island of k.get("island")) {
		// get all keys in localState.islands
		const islandIDs = Object.keys(localState.islands)
		// if the island doesn't exist in localState.islands, remove it
		let found = false
		for (const islandID of islandIDs) {
			if (island.is(islandID)) {
				found = true
			}
		}
		if (!found) {
			island.destroy()
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

k.debug.inspect = true

// Connect to the server when the page loads (you can call this function at an appropriate time)
connectToServer();
