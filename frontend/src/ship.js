import k from './main.js'

const railColor = {r: 79, g: 43, b:0}
const deckColor = {r: 122, g: 69, b:5}

export const createShip = (ship) => {
	console.log("creating ship", ship)

    const shipScale = 2
    const shipLength = 9000 * shipScale
    const shipWidth = 5000 * shipScale

    // create a new ship
    const s = k.add([
        k.rect(shipWidth, shipLength),
        k.opacity(0),
        k.anchor("center"),
        k.rotate(ship.angle + 90),
		k.pos(ship.x, ship.y),
        k.z(2),
        "ship", // shared tag
		ship.id, // unique taag
    ])

	// // add ship deck and collision zone
	s.add([
        k.pos(-shipWidth/2, -shipLength/2),
        k.polygon([
            k.vec2(shipWidth, 0),
            k.vec2(shipWidth, shipLength * 0.7),
            k.vec2(shipWidth * 0.5, shipLength),
            k.vec2(0, shipLength * 0.7),
            k.vec2(0, 0),
        ]
        ),
		k.color(k.rgb(deckColor.r, deckColor.g, deckColor.b)),
		k.z(2),
		k.area(),
		"ship", // shared tag
		ship.id, // unique taag
	])

    // add pilot spot
    s.add([
        k.rect(1200, 300),
        k.color(k.rgb(255, 0, 0)),
        k.pos(0, -shipLength/2 + 4000),
        k.anchor("center"),
        k.z(2),
        k.area(),
        "pilot",
    ])

    // add crow's nest
    s.add([
        k.circle(1000),
        k.color(k.rgb(railColor.r, railColor.g, railColor.b)),
        k.pos(0, 0),
        k.anchor("center"),
        k.z(2),
        k.area(),
        "crowsNest",
    ])
}