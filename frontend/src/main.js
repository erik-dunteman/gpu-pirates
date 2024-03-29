import kaboom from "kaboom"
import { connectToServer, sendDataToServer, localState } from './socket';
import { createShip } from './ship';
import { createPlayer } from './player';

export default k = kaboom()

k.loadSprite("bean", "sprites/bean.png")
k.loadSprite("compass", "sprites/compass.png")

k.setBackground(k.BLACK)

// add game water
k.add([
	k.rect(1_000_000, 1_000_000),
	k.color(k.BLUE),
	k.pos(0, 0),
	k.z(0),
])

const hud = k.add([
	k.rect(150, k.height()),
	k.pos(k.width(), 0),
	k.anchor("topright"),
	k.color(k.WHITE),
	k.fixed(),
	k.opacity(0.2),
	k.z(10),
])

const velocity = hud.add([
    k.text("0 Knots"),
	k.pos(-75, 170),
	k.anchor("center"),
    { value: 0 },
	k.scale(0.7),
])

const compass = hud.add([
	k.sprite("compass"),
	k.pos(-75, 75),
	k.anchor("center"),
	k.scale(0.5),
	"compass",
])


const updateHud = () => {
	compass.angle = localState.thisPlayer.angle + 90

	if (localState.thisPlayer.shipID){
		velocity.hidden = false
		const v = localState.ships[localState.thisPlayer.shipID].velocity
		velocity.text = Math.round(v * 1.94384 / 1000) + " Knots"
	} else {
		velocity.hidden = true
	}
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
		k.z(1),
		"island", // shared tag
		island.ID, // unique tag
	])
}

const createCannonball = (cannonball) => {
	// create a new cannonball
	console.log("creating cannonball", cannonball)
	const c = k.add([
		k.circle(500),
		k.pos(cannonball.x, cannonball.y),
		k.color(k.rgb(50, 50, 50)),
		k.anchor("center"),
		k.z(3),
		k.area(),
		"cannonball", // shared tag
		cannonball.id, // unique tag
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
			
			k.camPos(playerObj.pos)
			k.camRot(-90 + localState.thisPlayer.angle)
			if (localState.thisPlayer.controls === "crowsNest") {
				k.camScale(0.005)
			} else if (localState.thisPlayer.controls === "pilot" || localState.thisPlayer.controls === "cannon") {
				k.camScale(0.015)
			} else {
				// walk
				// k.camScale(0.04)
				k.camScale(0.02)
			}
			updateHud()
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

	// add ships or update them
	for (const shipID in localState.ships) {
		const shipMatches = k.get(shipID)
		if (shipMatches.length === 0) {
			createShip(localState.ships[shipID])
			continue
		}
		const shipObj = shipMatches[0]
		shipObj.moveTo(k.vec2(localState.ships[shipID].x, localState.ships[shipID].y))
		shipObj.angle = -localState.ships[shipID].angle - 90

		// update cannon angles
		for (const cannon of shipObj.get("cannon")) {
			cannon.angle = localState.ships[shipID].cannons[cannon.cannonId].angle + shipObj.angle // relative to ship since cannons are children of ship so will rotate with it
		}
	}

	// remove ships that are no longer in localState.ships
	for (const ship of k.get("ship")) {
		// get all keys in localState.ships
		const shipIDs = Object.keys(localState.ships)
		// if the ship doesn't exist in localState.ships, remove it
		let found = false
		for (const shipID of shipIDs) {
			if (ship.is(shipID)) {
				found = true
			}
		}
		if (!found) {
			ship.destroy()
		}
	}

	// add cannonballs or update them
	for (const cannonBallID in localState.cannonBalls) {
		const cannonBallMatches = k.get(cannonBallID)
		if (cannonBallMatches.length === 0) {
			createCannonball(localState.cannonBalls[cannonBallID])
			continue
		}
		const cannonBallObj = cannonBallMatches[0]
		cannonBallObj.moveTo(k.vec2(localState.cannonBalls[cannonBallID].x, localState.cannonBalls[cannonBallID].y))
		cannonBallObj.angle = -localState.cannonBalls[cannonBallID].angle - 90
	}
})

// k.debug.inspect = true

// Connect to the server when the page loads (you can call this function at an appropriate time)
connectToServer();
