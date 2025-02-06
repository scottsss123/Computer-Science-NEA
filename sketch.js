// scale factor from real diameter of sun to 100 pixels
const sf = 100 / 1.3914e9 
const GCONST = 6.67430e-11;
const BASETIMERATE = 1/60;
let G = GCONST;
// camera speed ~speed of light when camera isn't zoomed
const defaultZoom = 7.5;
let camSpeed = 3e8;
let camVel = [0,0];
let timeRate = 3600 * BASETIMERATE;

let screenWidth = 0;
let screenHeight = 0;

let following = "player"; 
let player;
let playerImg;

let bodies = [];

// TODO: 
// 
//
// IDEAS: 
// player can accelerate in any direction
// display bodies' paths of motion
// button ui at top of canvas , or above canvas , for objectives and/or functions currently operated by keyboard
//
// "for a level physics students to visualise scale of solar system and learn orbital mechanics"
// ~ game like objectives e.g. escape earth orbit, enter stable orbit around mars

class Body { 
	#name;
	#mass; //kg
	#diameter; //m
	#pos; 
	#color;
	#vel;

	constructor(name, mass, diameter, inPos, inVel, color) {
		this.#name = name;
		this.#mass = mass;
		this.#diameter = diameter;
		this.#pos = inPos;
		this.#color = color;
		this.#vel = inVel;
	}

	display() {
		ellipseMode(CENTER);
		fill(this.#color);
		ellipse(this.#pos[0], this.#pos[1], this.#diameter * sf);
	}

	updatePos() {
		this.#pos[0] += this.#vel[0] * timeRate;
		this.#pos[1] += this.#vel[1] * timeRate;
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
	getMass() {
		return this.#mass;
	}
	getVel() {
		return this.#vel;
	}
	//setters
	setVel(v) {
		this.#vel[0] = v[0];
		this.#vel[1] = v[1];
	}
	addVel(v) {
		this.#vel[0] += v[0];
		this.#vel[1] += v[1];
	}

	// other
	scaleSize(f) {
		this.#diameter *= f;
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
		
		let absolute_pos = body.getPos();
		let adjusted_pos = this.getAdjustedPos(absolute_pos);
		//if (body.getName() === 'player') console.log("ellispse: ", adjusted_pos);
		let adjusted_diameter = this.getAdjustedDiameter(body.getDiameter());
		
		if (body.getName() === 'player') {
			imageMode(CENTER);
			image(playerImg, adjusted_pos[0], adjusted_pos[1], adjusted_diameter, adjusted_diameter);
		} else {
			ellipse(adjusted_pos[0], adjusted_pos[1], adjusted_diameter);
		}
	}

	displayPlayer() {
		imageMode(CENTER);
	
		
		let absolute_pos = findBodyByName('player').getPos();
		let adjusted_pos = this.getAdjustedPos(absolute_pos);
		//console.log("img: ",adjusted_pos);
		let adjusted_diameter = this.getAdjustedDiameter(findBodyByName('player').getDiameter());
		image(playerImg, adjusted_pos[0], adjusted_pos[1], adjusted_diameter,adjusted_diameter); // :(
	}
}

function preload() {
	playerImg = loadImage("player_img.png");
}

function setup() {
	new Canvas(windowWidth,windowHeight);
	displayMode('centered');	

	camera = new Camera([0,0],100);
	
	bodies.push(new Body("sun", 1.9885e30, 1.3914e9, [0, 0], [0,0], 'yellow'));
	bodies.push(new Body("mercury", 3.3011e23, 4.88e6, [5.791e10, 0], [0,0], 'grey'));
	bodies.push(new Body("venus", 4.8675e24, 1.21036e7, [1.0821e11,0], [0,0], 'orange'));
	bodies.push(new Body("earth", 5.972e24, 1.275627e7, [1.496e11, 0], [0, 29.78e3], 'blue'));
	bodies.push(new Body("moon", 7.35e22, 3.5e6, [1.496e11, 3.84e8], [1e3, 29.78e3], 'grey'));
	bodies.push(new Body("mars", 6.4191e23, 6.79238e6, [2.2794e11, 0], [0,0], 'red'));
	bodies.push(new Body("jupiter", 1.8982e27, 1.42984e8, [7.7841e11, 0], [0,0], 'brown'));
	
	bodies.push(new Body("player", 5700, 3.5e6,[ 1.275627e7 + 1.496e11 + 200e3, 0], [0, 29.78e3 + 5.5e3], 'green')); // 100 freyas of mass

}//1.275627e7

function draw() {
	screenWidth = windowWidth;
	screenHeight = windowHeight;

	G = GCONST * timeRate;

	background('black');

	// display bodies
	for (let body of bodies) {
		camera.display(body);
		body.updatePos();
	}

	updateVelocities();

	keyboardInput();
	camera.updatePos(camVel);
	if (following !== "") {
		camera.setPos(findBodyByName(following).getPos());
	}

	
}


function updateVelocities() {
	for (let i = 0; i < bodies.length; i++) {
		for (let j = i + 1; j < bodies.length; j++) {
			// can be largely optimised

			let pos1 = bodies[i].getPos();
			let pos2 = bodies[j].getPos();

			// f force (N) between body 1 and 2
			let f = G * ((bodies[i].getMass() * bodies[j].getMass()) / (dist(pos1[0],pos1[1],pos2[0],pos2[1]) ** 2));
			// d = unit vector in direction of body 1 (i)
			
			let d = [pos2[0] - pos1[0], pos2[1] - pos1[1]];
			let mod_d = Math.sqrt((d[0] ** 2) + (d[1] ** 2));
			d[0] = d[0] / mod_d;
			d[1] = d[1] / mod_d;

			let forceVec = [d[0] * f, d[1] * f];
			
			let accelerationVec = [forceVec[0] / bodies[i].getMass(), forceVec[1] / bodies[i].getMass()];
			let otherBodyAcceleration = [-1 * (forceVec[0] / bodies[j].getMass()), -1 * (forceVec[1] / bodies[j].getMass())];			
			bodies[i].addVel(accelerationVec);
			bodies[j].addVel(otherBodyAcceleration);
		}
	}
}

function mouseWheel(event) { // todo: if holding control, scale player size & not alter zoom
	if (event.delta > 0) { // down
		if (kb.pressing('shift')) {
			findBodyByName('player').scaleSize(1.1);
		} else {
			camera.alterZoom(1/1.1);
		}
	} else { // up
		if (kb.pressing('shift')) {
			findBodyByName('player').scaleSize(1 / 1.1);
		} else {
			camera.alterZoom(1.1);
		}
	}
}

function findBodyByName(name) {
	for (let body of bodies) {
		if (body.getName() === name) {
			return body;
		}
	}
	console.log("invalid body name");
	return -1;
}

let n = 0;
function mousePressed() {
	for (let body of bodies) {
		
		let bodyScreenCentre = camera.getAdjustedPos(body);
		let bodyScreenRadius = 0.5 * camera.getAdjustedDiameter(body);

		if (dist(mouseX, mouseY, bodyScreenCentre[0], bodyScreenCentre[1]) <= bodyScreenRadius) {
			console.log(body.getName());
			console.log(body);
		}
	}
	n++;
	console.log("framecount log " + n + ": " + frameCount);
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
		following = "";
		let p = prompt("enter body name:");
		for (let body of bodies) {
			if (body.getName() === p) {
				camera.setPos(body.getPos());
			}
		}
	}

	if (kb.presses('f')) {
		let i = prompt("type body to follow");
		if (i === "") {
			following = "";
			return;
		}
		for (let body of bodies) {
			if (body.getName() === i) {
				following = i;
				return;
			}
		}
	}

	if (kb.presses('t')) {
		let t = prompt("enter fast forward speed ('1' -> 1/60 seconds per frame -> real time, '3600' -> 3600/60 seconds per fram -> 1 hour per second)");
		timeRate = BASETIMERATE * Number(t);
	}
	
	// reset
	if(kb.presses('r')) {
		reset();
	}
}
