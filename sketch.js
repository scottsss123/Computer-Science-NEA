// x / 1.3914e9 maps diameter of sun to diameter of x pixels
const sf = 100 / 1.3914e9
let camSpeed = 3e8;
let camVel = [0,0];
let screenWidth = 0;
let screenHeight = 0;


class Body {
	#name;
	#mass; //kg
	#diameter; //m
	#pos; 
	#color;

	constructor(name, mass, diameter, x, y, color) {
		this.#name = name;
		this.#mass = mass;
		this.#diameter = diameter;
		this.#pos = [x,y];
		this.#color = color;
	}

	display() {
		ellipseMode(CENTER);
		fill(this.#color);
		ellipse(this.#pos[0], this.#pos[1], this.#diameter * sf);
	}

	// getters
	getDiameter() {
		return this.#diameter;
	}
	getPos() {
		return this.#pos;
	}
	getColor() {
		return this.#color;
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

	updatePos(vec2d) {
		this.#pos[0] += vec2d[0];
		this.#pos[1] += vec2d[1];
	}

	display(body) {
		ellipseMode(CENTER);
		fill(body.getColor());
		noStroke();
		
		let absolute_pos = body.getPos();
		let adjusted_pos = [((absolute_pos[0] - this.#pos[0]) * sf * this.#zoom) + (screenWidth/2), ((absolute_pos[1] - this.#pos[1]) * sf * this.#zoom) + (screenHeight/2)];
		let adjusted_diameter = this.#zoom * sf * body.getDiameter();
		ellipse(adjusted_pos[0], adjusted_pos[1], adjusted_diameter);
	}
}

let sun;
let earth;
let moon;
let camera;

function setup() {
	new Canvas(windowWidth,windowHeight);
	displayMode('centered');	

	camera = new Camera([0,0],1);
	sun = new Body("sun", 1.9885e30, 1.3914e9, 0, 0, 'yellow');
	earth = new Body("earth", 5.972e24, 1.3914e9, 1.496e11, 0, 'blue');
	moon = new Body("moon", 7.35e10^22, 3.5e6, 1.496e11, -8.8417e7, 'grey');
}//1.275627e7

function draw() {
	screenWidth = windowWidth;
	screenHeight = windowHeight;

	background('black');

	camera.display(sun);
	camera.display(earth);
	camera.display(moon);

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

	if (kb.presses('+')) {
		camera.alterZoom(1.1);
	} else if (kb.presses('-')) {
		camera.alterZoom(1/1.1);
	}

	camera.updatePos(camVel);
}

function mouseWheel(event) {
	if (event.delta > 0) { // down
		camera.alterZoom(1/1.1);
	} else { // up
		camera.alterZoom(1.1);
	}
}
