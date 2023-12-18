import kaboom from "kaboom"

// Initialize kaboom
const k = kaboom()

// Load the sprite
k.loadSprite("bean", "sprites/pirate.png")

k.setBackground(k.BLACK)

k.camScale(0.2)

// create map anchor centered on the screen to rotate around
const map = k.add([
	k.pos(k.width()/2, k.height()/2),
	k.anchor("center"),
	k.rotate(0),
	k.circle(100),
	k.color(k.BLUE)
])

// add children, relative to parent
map.add([
	k.pos(500, 0),
	k.rect(1000, 300),
	k.area(),
	k.body(),
	"obstacle",
])


// Define a class for your custom object
class Bean {
    constructor() {

		this.bean = k.add([
            k.pos(k.width()/2, k.height()/2),
			k.anchor("center"),
			k.area(),
			k.circle(100),
			k.body()
            // k.sprite("bean"),
        ])
		
		this.velocity = { y: 0}
		this.angle = 0
        
        this.setupControls()
    }

    // Method to update the bean's position based on velocity
    update() {
		// follow camera
		camPos(this.bean.pos)

		this.bean.move(0, this.velocity.y)
		// update map position to relative to bean
		map.pos = this.bean.pos

		// move the children relative to the anchor point
		map.children.forEach(child => {
			child.move(
				this.velocity.y * Math.sin(this.angle * Math.PI / 180), 
				this.velocity.y * -Math.cos(this.angle * Math.PI / 180)
			);
		});

		// decrease velocity
		this.velocity.y *= 0.99
		if (this.velocity.y < 0.1 && this.velocity.y > -0.1) {
			this.velocity.y = 0
		}
    }

    // Method to setup controls
    setupControls() {
		const rotateSpeed = 3
        k.onKeyDown("a", () => {
			this.angle -= rotateSpeed
			map.angle += rotateSpeed
		})
        k.onKeyDown("d", () => {
			this.angle += rotateSpeed
			map.angle -=  rotateSpeed
		})
		
        k.onKeyDown("w", () => {
			if (this.bean.isColliding("obstacle")) {
				alert("hit")
				this.velocity.y = 0
				return
			}
			this.velocity.y = -300
		})
        k.onKeyDown("s", () => {
			this.velocity.y = 300
		})
    }
}
// Create a new Bean instance
const myBean = new Bean()

// Update loop
k.onUpdate(() => {
	myBean.update()
})
