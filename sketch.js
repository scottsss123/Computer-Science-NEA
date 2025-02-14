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

let following = "earth"; 
let followingOffset = [0,0]; // implement this
let player;
let playerImg;
const basePlayerAccelerationScalar = 9.80665; // 1g of acceleration
let playerAccelerationScalar = basePlayerAccelerationScalar;
let toggleBackground = true;

let bodies = [];
let tBodies = [];

// TODO: 
// (maybe) fix player flying out of orbit at fast timeRate 
//
// IDEAS: 
// player can accelerate in any direction
// display bodies' future paths of motion
// button ui at top of canvas , or above canvas , for objectives and/or functions currently operated by keyboard
//
// "for a level physics students to visualise scale of solar system and learn orbital mechanics"
// ~ game like objectives e.g. escape earth orbit, enter stable orbit around mars

class Body { 
	#name;
	#mass; //kg
	#baseDiameter;
	#diameter; //m
	#pos; 
	#color;
	#vel;

	constructor(name, mass, diameter, inPos, inVel, color) {
		this.#name = name;
		this.#mass = mass;
		this.#baseDiameter = diameter;
		this.#diameter = diameter;
		this.#pos = inPos;
		this.#color = color;
		this.#vel = inVel;
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
	setScale(s) {
		this.#diameter = s * this.#baseDiameter;
	}
	setPos(p) {
		this.#pos[0] = p[0];
		this.#pos[1] = p[1];
	}
	getProgradeUnitVec(body) { //returns unit vector in prograde direction relative to body parameter
		let bV = body.getVel();
		let v = [this.#vel[0]- bV[0], this.#vel[1] - bV[1]];
		let out = calculateUnitVec(v);
		return out;
	}
	getNormalUnitVec(body) {
		let bP = body.getPos();
		let v = [this.#pos[0] - bP[0], this.#pos[1] - bP[1]];
		let out = calculateUnitVec(v);
		return out;
	}
}

class Player extends Body {
	constructor(name, mass, diameter, inPos, inVel, color) {
		super(name, mass, diameter, inPos, inVel, color);
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
		return [((absolute_pos[0] - this.#pos[0] - (followingOffset[0] / this.#zoom)) * sf * this.#zoom) + (screenWidth/2), ((absolute_pos[1] - this.#pos[1] - (followingOffset[1] / this.#zoom)) * sf * this.#zoom) + (screenHeight/2)]
	}

	getAdjustedDiameter(absolute_diameter) {
		return this.#zoom * sf * absolute_diameter;
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

	lineAB(posA, posB) {
		stroke('yellow');
		strokeWeight(1);
		let adjustedPosA = this.getAdjustedPos(posA);
		let adjustedPosB = this.getAdjustedPos(posB);
		line(adjustedPosA[0], adjustedPosA[1], adjustedPosB[0], adjustedPosB[1]);
	}
}

function preload() {
	playerImg = loadImage("player_img.png");
}

function setup() {
	new Canvas(windowWidth,windowHeight);
	displayMode('centered');	

	camera = new Camera([0,0],100);
	
	//bodies.push(new Body("sun", 1.9885e30, 1.3914e9, [0, 0], [0,0], 'yellow'));
	//bodies.push(new Body("mercury", 3.3011e23, 4.88e6, [5.791e10, 0], [0,47.4e3], 'grey'));
	//bodies.push(new Body("venus", 4.8675e24, 1.21036e7, [1.0821e11,0], [0,35e3], 'orange'));
	bodies.push(new Body("earth", 5.972e24, 1.275627e7, [1.496e11, 0], [0, 29.78e3], 'blue'));
	bodies.push(new Body("moon", 7.35e22, 3.5e6, [1.496e11, 3.84e8], [1e3, 29.78e3], 'grey'));
	//bodies.push(new Body("mars", 6.4191e23, 6.79238e6, [2.2794e11, 0], [0,24e3], 'red'));
	//bodies.push(new Body("phobos", 1.06e16, 11e3, [2.2794e11, 9.376e6], [2.1e3, 24e3], 'grey'));
	//bodies.push(new Body("jupiter", 1.8982e27, 1.42984e8, [7.7841e11, 0], [0,13.1e3], 'brown'));
	//bodies.push(new Body("saturn", 5.683e26, 1.1647e8, [1.43e12, 0], [0, 9.69e3], '#fae5bf'));
	//bodies.push(new Body("uranus", 8.6810e25, 5.0724e7, [2.87e12, 0], [0, 6.835e3], '#B2D6DB'));
	//bodies.push(new Body("neptune", 1.02409e26, 4.9244e7, [4.5e12, 0],[0, 5.43e3], '#7CB7BB'));
	
	bodies.push(new Player("player", 5700, 3.5e6,[ 1.275627e7 + 1.496e11 + 200e3, 0], [0, 29.78e3 - 5.5e3], 'green')); // 100 freyas of mass

	for (let b of bodies) {
		tBodies.push(new Body(b.getName(), b.getMass(), 1e7, b.getPos(), b.getVel(), 'green'));
	}

	background('black');
	console.log("press:\nf: follow planet (type planet name into prompt)\np: pan to planet\nw,a,s,d: move camera if not following planet (will update this)\nscroll: zoom in/out\nc: log camera data\nt: adjust time rate\nclick on body: log body data\nl: enlarge bodies, recommended enlargements scale = 50\narrow keys:accelerate player relative to orbit around focused planet\np:acceleration scalar\nb: toggle draw backgrround")
}//1.275627e7

function draw() {
	screenWidth = windowWidth;
	screenHeight = windowHeight;

	G = GCONST * timeRate;

	if (toggleBackground) background('black');

	for (let i = 0; i < bodies.length; i++) {
		camera.display(bodies[i]);
		camera.display(tBodies[i]);
		bodies[i].updatePos();
		tBodies[i].updatePos();
	}

	updateVelocities(bodies);
	for (let i = 0; i < bodies.length; i++) {
		tBodies[i].setVel(bodies[i].getVel());
	}

	keyboardInput();
	
	if (following !== "") {
		camera.setPos(findBodyByName(following).getPos());
	} else {
		camera.updatePos(camVel);
	}

	// display bodies
	displayBodyPath(tFindBodyByName('earth')); // yikes
	//camera.lineAB(findBodyByName('earth').getPos(), findBodyByName('player').getPos());
}

function updateVelocities(bodyArr) {
	for (let i = 0; i < bodyArr.length; i++) {
		for (let j = i + 1; j < bodyArr.length; j++) {
			// can be largely optimised

			let pos1 = bodyArr[i].getPos();
			let pos2 = bodyArr[j].getPos();

			// f force (N) between body 1 and 2
			let f = G * ((bodyArr[i].getMass() * bodyArr[j].getMass()) / (dist(pos1[0],pos1[1],pos2[0],pos2[1]) ** 2));
			// d = unit vector in direction of body 1 (i)
			
			let d = [pos2[0] - pos1[0], pos2[1] - pos1[1]];
			let mod_d = Math.sqrt((d[0] ** 2) + (d[1] ** 2));
			d[0] = d[0] / mod_d;
			d[1] = d[1] / mod_d;

			let forceVec = [d[0] * f, d[1] * f];
			
			let accelerationVec = [forceVec[0] / bodyArr[i].getMass(), forceVec[1] / bodyArr[i].getMass()];
			let otherBodyAcceleration = [-1 * (forceVec[0] / bodyArr[j].getMass()), -1 * (forceVec[1] / bodyArr[j].getMass())];			
			bodyArr[i].addVel(accelerationVec);
			bodyArr[j].addVel(otherBodyAcceleration);
		}
	}
}

function mouseWheel(event) { 
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

function tFindBodyByName(name) { // this is bad
	for (let body of tBodies) {
		if (body.getName() === name) {
			return body;
		}
	}
	console.log("invalid body name");
	return -1;
}

function calculateUnitVec(v) {
	let modV = Math.sqrt(((v[0])**2) + ((v[1])**2));
	let out = [0,0];
	out[0] = v[0] / modV;
	out[1] = v[1] / modV;
	return out;
	
}

function mousePressed() {
	background('black');
	for (let body of bodies) {
		
		let bodyScreenCentre = camera.getAdjustedPos(body.getPos());
		let bodyScreenRadius = 0.5 * camera.getAdjustedDiameter(body.getDiameter());

		if (dist(mouseX, mouseY, bodyScreenCentre[0], bodyScreenCentre[1]) <= bodyScreenRadius) {
			console.log(body.getName());
			console.log(body);
		}
	}
}

let focus = 'earth'
function keyboardInput() {
	// camera movement
	let posChange = [0,0];
	if (kb.pressing('d')) { 
		posChange = [camSpeed,0];
	} 
	else if (kb.pressing('a')) {
		posChange = [-camSpeed,0];
	}
	else if (kb.pressing('w')) {
		posChange = [0,-camSpeed];
	}
	else if (kb.pressing('s')) {
		posChange = [0,camSpeed];
	}
	else {
		posChange = [0,0];
	}
	if (following !== "") {
		followingOffset[0] += posChange[0]; // different logic is ugly but works
		followingOffset[1] += posChange[1];
	} else {
		camVel = posChange;
	}

	if (kb.presses('o')) {
		let f = prompt("enter focus body, accelerate in orbit relative to focus");
		focus = f;
	}

	// possibly change this to prograde, retrograde, normal, antinormal when orbit lines are showing
	let progradeDirVec = findBodyByName('player').getProgradeUnitVec(findBodyByName(focus));
	let normalDirVec = findBodyByName('player').getNormalUnitVec(findBodyByName(focus));
	if (kb.pressing('up')) { 
		findBodyByName('player').addVel(scalarMultiplyVec2d(progradeDirVec, playerAccelerationScalar));
	} 
	if (kb.pressing('down')) {
		findBodyByName('player').addVel(scalarMultiplyVec2d([-1 * progradeDirVec[0], -1 * progradeDirVec[1]], playerAccelerationScalar));
	}
	if (kb.pressing('right')) {
		findBodyByName('player').addVel(scalarMultiplyVec2d(normalDirVec, playerAccelerationScalar));
	}
	if (kb.pressing('left')) {
		findBodyByName('player').addVel(scalarMultiplyVec2d([-1 * normalDirVec[0],-1 * normalDirVec[1]], playerAccelerationScalar));
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

	if (kb.presses('b')) {
		toggleBackground = toggleBackground ? false : true;
	}

	// pan to given body
	//if (kb.presses('p')) {
	//	followingOffset = [0,0];
	//	following = "";
	//	let p = prompt("enter body name:");
	//	for (let body of bodies) {
	//		if (body.getName() === p) {
	//			camera.setPos(body.getPos());
	//		}
	//	}
	//}

	if (kb.presses('f')) {
		followingOffset = [0,0];
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

	if (kb.presses('p')) {
		let p = prompt('enter player acceleration speed (g)')
		playerAccelerationScalar = Number(p) * basePlayerAccelerationScalar;
	}

	if (kb.presses('t')) {
		let t = prompt("enter fast forward speed ('1' -> 1/60 seconds per frame -> real time, '3600' -> 3600/60 seconds per fram -> 1 hour per second)");
		timeRate = BASETIMERATE * Number(t);
	}

	if (kb.presses('l')) {
		let s = prompt("enter body scale");
		for (let body of bodies) {
			body.setScale(Number(s));
		}
	}
}

function scalarMultiplyVec2d(vec, scalar) {
	return [vec[0] * scalar, vec[1] * scalar];
}

let depth = 10;
function displayBodyPath(body) {
	
	
}