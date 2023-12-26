import k from './main.js'

// units are centimeters / second

const wallWidth = 30

export default class Map {
	constructor() {
		this.map = k.add([
			k.rect(300, wallWidth),
			k.pos(k.width()/2, 10),
			k.body({mass: 1000}),
			k.area(),
		])

	}
}