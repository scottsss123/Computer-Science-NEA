// scale factor from real diameter of sun to 100 pixels
const sf = 100 / 1.3914e9 

// camera speed ~speed of light when camera isn't zoomed
const defaultZoom = 7.5;
let camSpeed = 3e8;
let camVel = [0,0];

let screenWidth = 0;
let screenHeight = 0;

let enlargedMode = false;
let enlargedModeScale = 30

// TODO: 
// 
//
// IDEAS: 
// ideal zoom attribute for when panning straight to body it fits frame nicely
// controllable rocket or spaceship, 'player', starts in low earth orbit
// can accelerate in any direction, showing predicted path line, initially circular around earth
// player is affected by gravity of all bodies which all start in orbit around the sun with their own predicted path line
// ? planets only affected by the most significant force, moon only considers forces from earth which only considers forces from sun
// bodies and player have mass (scalar)(kg), velocity(arr length 2)(x,y)(m/s), forces(acting on them)(arr length 2)(x,y or i,j)(N)
// can calculate acceleration due to resultant force on body
// can calculate magnitude force on body due to gravity (classical) using formula, F = G(m1m2)/r^2
// can calculate angle of force on body with trig then update force acting on body accordingly

class Body { 
	#name;
	#mass; //kg
	#diameter; //m
	#pos; 
	#color;
	#enlargedModeSize; //suns, small bodies e.g. moons not displayed , = 0

	constructor(name, mass, diameter, x, y, color, enlargedModeSize) {
		this.#name = name;
		this.#mass = mass;
		this.#diameter = diameter;
		this.#pos = [x,y];
		this.#color = color;
		this.#enlargedModeSize = enlargedModeSize;
	}

	display() {
		ellipseMode(CENTER);
		fill(this.#color);
		ellipse(this.#pos[0], this.#pos[1], this.#diameter * sf);
	}

	// getters
	getName() {
		return this.#name;
	}
	getDiameter() {
		return this.#diameter;
	}
	getPos() {
		return this.#pos;
	}
	getColor() {
		return this.#color;
	}
	getEnlargedModeSize() {
		return this.#enlargedModeSize;
	}
}

class Camera {
	#pos;
	#zoom;

	constructor(startPos, startZoom) {
		this.#pos = startPos;
		this.#zoom = startZoom;
	}

	alterZoom(scale) {
		this.#zoom *= scale;
	}

	updatePos(displacement) {
		this.#pos[0] += displacement[0] / this.#zoom;
		this.#pos[1] += displacement[1] / this.#zoom;
	}

	setPos(pos) {
		this.#pos[0] = pos[0];
		this.#pos[1] = pos[1];
	}

	getAdjustedPos(body) {
		return [((body.getPos()[0] - this.#pos[0]) * sf * this.#zoom) + (screenWidth/2), ((body.getPos()[1] - this.#pos[1]) * sf * this.#zoom) + (screenHeight/2)]
	}

	getAdjustedDiameter(body) {
		if (enlargedMode) {
			return this.#zoom * sf * 1.3914e9 * body.getEnlargedModeSize() * enlargedModeScale; 
		}
		return this.#zoom * sf * body.getDiameter();
	}

	getZoom() {
		return this.#zoom;
	}
	setZoom(zoom) {
		this.#zoom = zoom;
	}
	getPos() {
		return this.#pos;
	}

	display(body) {
		ellipseMode(CENTER);
		fill(body.getColor());
		noStroke();

		let adjusted_pos = this.getAdjustedPos(body);
		let adjusted_diameter = this.getAdjustedDiameter(body);
		ellipse(adjusted_pos[0], adjusted_pos[1], adjusted_diameter);
	}
}

let bodies = [];

function setup() {
	new Canvas(windowWidth,windowHeight);
	displayMode('centered');	

	camera = new Camera([0,0],7.5);
	
	//                    name, mass(kg), diameter(m),x,y,colour,enlargedMode diameter (suns)
	bodies.push(new Body("sun", 1.9885e30, 1.3914e9, 0, 0, 'yellow', 1));
	bodies.push(new Body("mercury", 3.3011e23, 4.88e6, 5.791e10, 0, 'grey', 0.1));
	bodies.push(new Body("venus", 4.8675e24, 1.21036e7, 1.0821e11,0, 'orange', 0.2));
	bodies.push(new Body("earth", 5.972e24, 1.275627e7, 1.496e11, 0, 'blue', 0.3));
	bodies.push(new Body("moon", 7.35e22, 3.5e6, 1.496e11, -8.8417e7, 'grey', 0));
	bodies.push(new Body("mars", 6.4191e23, 6.79238e6, 2.2794e11, 0, 'red', 0.25));
	bodies.push(new Body("jupiter", 1.8982e27, 1.42984e8, 7.7841e11, 0, 'brown', 0.7));
	bodies.push(new Body("saturn", 5.6834e26, 5.8232e7, 1.43e12, 0, [250,229,191], 0.55));
	
}//1.275627e7

function draw() {
	screenWidth = windowWidth;
	screenHeight = windowHeight;

	background('black');

	// display bodies
	for (let body of bodies) {
		camera.display(body);
	}

	keyboardInput();
	camera.updatePos(camVel);
}

function reset() {
	camera.setPos([0,0]);
	camera.setZoom(defaultZoom);
	enlargedMode = false;
}

function mouseWheel(event) {
	if (event.delta > 0) { // down
		camera.alterZoom(1/1.1);
	} else { // up
		camera.alterZoom(1.1);
	}
}

function mousePressed() {
	for (let body of bodies) {
		
		let bodyScreenCentre = camera.getAdjustedPos(body);
		let bodyScreenRadius = 0.5 * camera.getAdjustedDiameter(body);

		if (dist(mouseX, mouseY, bodyScreenCentre[0], bodyScreenCentre[1]) <= bodyScreenRadius) {
			console.log(body.getName());
		}
	}
}

function keyboardInput() {
	// camera movement
	if (kb.pressing('d')) { 
		camVel = [camSpeed,0];
	} 
	else if (kb.pressing('a')) {
		camVel = [-camSpeed,0];
	}
	else if (kb.pressing('w')) {
		camVel = [0,-camSpeed];
	}
	else if (kb.pressing('s')) {
		camVel = [0,camSpeed];
	}
	else {
		camVel = [0,0];
	}

	// alternate zoom to scroll wheel
	if (kb.presses('+')) {
		camera.alterZoom(1.1);
	} else if (kb.presses('-')) {
		camera.alterZoom(1/1.1);
	}

	// log camera details 
	if (kb.presses('c')) {
		console.log(camera.getPos());
		console.log(camera.getZoom());
	}

	if (kb.presses('e')) {
		//camera.alterZoom(enlargedMode ? 30 : 1/30);
		enlargedMode = !enlargedMode;
	}

	// pan to given body
	if (kb.presses('p')) {
		let p = prompt("enter body name:");
		for (let body of bodies) {
			if (body.getName() === p) {
				camera.setPos(body.getPos());
			}
		}
	}
	
	// reset
	if(kb.presses('r')) {
		reset();
	}
}
