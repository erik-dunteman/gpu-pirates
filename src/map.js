import k from './main.js'

// units are centimeters / second

const wallWidth = 30


const numberOfIslands = 50; // Number of islands

const mapMaxY = -1000; // In front of the player
const mapMinY = -50000; // Miniumum y value for islands

const mapMaxX = 30000; // Maximum x value for islands
const mapMinX = -30000; // Minimum y value for islands

const islandMinVertices = 3; // Minimum number of points (vertices)
const islandMaxVertices = 5; // Maximum number of points (vertices)
const islandMaxSize = 1000;
const islandMinSize = 100;

export default class Map {
    constructor() {

		k.setBackground(k.BLUE)

        

        this.map = k.add(
			[
				k.pos(300, 0),
				k.rect(500, 1000),
				k.color(k.BLACK),
				k.area(),
            	"island"
        	]
		);

        this.map.add([
            k.pos(0, 0),
				k.rect(500, 1000),
				k.color(k.BLACK),
				k.area(),
				k.body({ isStatic: true }),
            	"islandBody"
            ]
        );



        // Add many islands
        for (let i = 0; i < numberOfIslands; i++) {
            this.addIsland();
        }
    }

    addIsland() {
        const islandSize = Math.random() * (islandMaxVertices - islandMinVertices) + islandMinVertices; // Random size within range
        const x = Math.random() * (mapMaxX - mapMinX) + mapMinX; // Random x position
        const y = Math.random() * (mapMaxY - mapMinY) + mapMinY; // Random y position

        const points = [];
        for (let j = 0; j < islandSize; j++) {
            const angle = j * (360 / islandSize);
            const radius = Math.random() * (islandMaxSize - islandMinSize) + islandMinSize; // Random radius for irregularity
            const point = k.vec2(
                Math.cos(angle * Math.PI / 180) * radius, 
                Math.sin(angle * Math.PI / 180) * radius
            );
            points.push(point);
        }

        const island = this.map.add([
            k.pos(x, y),
            k.polygon(points),
            k.area(),
            "island"
        ]);

        // add body
        island.add([
            k.pos(0, 0),
            k.polygon(points),
            k.color(k.GREEN),
            k.area(),
            k.body({ isStatic: true }),
            k.anchor("center"),
            "islandBody"
        ]);
    }
}

