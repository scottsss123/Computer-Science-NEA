// x / 1.3914e9 maps diameter of sun to diameter of x pixels
const sf = 100 / 1.3914e9
let camSpeed = 1.496e11 / 300;
let camVel = [0,0];
let screenWidth = 0;
let screenHeight = 0;


class Body { // TODO: ideal zoom attribute for when panning straight to body it fits frame nicely
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

	getAdjustedPos(absolute_pos) {
		return [((absolute_pos[0] - this.#pos[0]) * sf * this.#zoom) + (screenWidth/2), ((absolute_pos[1] - this.#pos[1]) * sf * this.#zoom) + (screenHeight/2)]
	}

	getAdjustedDiameter(absolute_diameter) {
		return this.#zoom * sf * absolute_diameter
	}

	getZoom() {
		return this.#zoom;
	}
	getPos() {
		return this.#pos;
	}

	display(body) {
		ellipseMode(CENTER);
		fill(body.getColor());
		noStroke();
		
		let absolute_pos = body.getPos();
		let adjusted_pos = this.getAdjustedPos(absolute_pos);
		let adjusted_diameter = this.getAdjustedDiameter(body.getDiameter());
		ellipse(adjusted_pos[0], adjusted_pos[1], adjusted_diameter);
	}
}

let bodies = [];
let sun;
let earth;
let moon;
let mars;
let camera;

function setup() {
	new Canvas(windowWidth,windowHeight);
	displayMode('centered');	

	camera = new Camera([0,0],1);
	
	bodies.push(new Body("sun", 1.9885e30, 1.3914e9, 0, 0, 'yellow'));
	bodies.push(new Body("mercury", 3.3011e23, 4.88e6, 5.791e10, 0, 'grey'))
	bodies.push(new Body("earth", 5.972e24, 1.275627e7, 1.496e11, 0, 'blue'));
	bodies.push(new Body("moon", 7.35e22, 3.5e6, 1.496e11, -8.8417e7, 'grey'));
	bodies.push(new Body("mars", 6.4191e23, 6.79238e6, 2.2794e11, 0, 'red'));
	
}//1.275627e7

function draw() {
	screenWidth = windowWidth;
	screenHeight = windowHeight;

	background('black');

	for (let body of bodies) {
		camera.display(body);
	}

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

	if (kb.presses('c')) {
		console.log(camera.getPos());
		console.log(camera.getZoom());
	}

	if (kb.presses('p')) {
		let p = prompt("enter body name:");
		for (let body of bodies) {
			if (body.getName() === p) {
				camera.setPos(body.getPos());
			}
		}
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

function mousePressed() {
	for (let body of bodies) {
		
		let bodyScreenCentre = camera.getAdjustedPos(body.getPos());
		let bodyScreenRadius = 0.5 * camera.getAdjustedDiameter(body.getDiameter());

		if (dist(mouseX, mouseY, bodyScreenCentre[0], bodyScreenCentre[1]) <= bodyScreenRadius) {
			console.log(body.getName());
		}
	}
}
