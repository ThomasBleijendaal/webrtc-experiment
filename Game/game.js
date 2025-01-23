const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;

class Ship {
    color = "red";

    direction = 0;
    speed = 0;

    x = 500;
    y = 500;

    masts = 1;
    cannons = 10;
    loadedCannons = 0;
    health = 10;

    maxSpeed = function () {
        return 1 + (this.masts * 0.2);
    }
    angle = function () {
        return this.direction * Math.PI / 180.0;
    }
    length = function() {
        return 15 + (ship.masts * 3);
    }
    width = function() {
        return 10 + (ship.cannons / 20);
    }
}

class Debris {
    x = 0;
    y = 0;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class CannonBall {
    x = 0;
    y = 0;
    direction = 0;
    age = 0;

    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.direction = direction;
    }

    angle = function () {
        return this.direction * Math.PI / 180.0;
    }
}

const ship = new Ship();
const debris = new Set();
const cannonBalls = new Set();

function drawSea() {
    ctx.beginPath();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#4080ff"
    ctx.rect(0, 0, width, height);
    ctx.fill();
}

function drawShip(ship, cannonBalls) {
    let cannonBallsHit = 0;

    let shipAngle = ship.angle();
    let shipWidth = ship.width();
    let shipLength = ship.length();

    let halfWidth = shipWidth / 2;
    let halfLength = shipLength / 2;

    let shipPath = new Path2D();
    shipPath.moveTo(0, shipLength);
    shipPath.lineTo(0, 5);
    shipPath.lineTo(halfWidth, 0);
    shipPath.lineTo(shipWidth, 5);
    shipPath.lineTo(shipWidth, shipLength);
    shipPath.lineTo(0, shipLength);

    ctx.beginPath();
    ctx.fillStyle = ship.color;

    ctx.translate(ship.x, ship.y);
    ctx.rotate(shipAngle);
    ctx.translate(-halfWidth, -halfLength);

    ctx.fill(shipPath);

    for (let b of cannonBalls) {
        if (ctx.isPointInPath(shipPath, b[0].x, b[0].y)) {
            cannonBallsHit++;
        }     
    }

    ctx.translate(-halfWidth, halfLength);
    ctx.fillStyle = "black";
    ctx.rect(halfWidth, 7 - halfLength, 2, shipLength - 10);

    ctx.translate(shipWidth, 0);

    ctx.rect(halfWidth - 2, 7 - halfLength, 2, shipLength - 10);
    ctx.fill();

    ctx.rotate(-shipAngle);
    ctx.translate(-ship.x, -ship.y);

    return cannonBallsHit;
}

function drawDebris(debris) {
    ctx.beginPath();
    ctx.fillStyle = "brown";

    ctx.translate(debris.x, debris.y);

    ctx.rect(0, 0, 4, 4);
    ctx.fill();

    ctx.translate(-debris.x, -debris.y);
}

function drawCannonBall(cannonBall) {
    ctx.beginPath();
    ctx.fillStyle = "black";

    ctx.translate(cannonBall.x, cannonBall.y);

    ctx.arc(0, 0, 2, 0, 2 * Math.PI)
    ctx.fill();

    ctx.translate(-cannonBall.x, -cannonBall.y);
}

function drawFrame() {
    drawSea();
    for (let d of debris.entries()) {
        drawDebris(d[0]);

        if (Math.random() <= 0.005) {
            debris.delete(d[0]);
        }
    }
    for (let b of cannonBalls.entries()) {
        drawCannonBall(b[0]);

        if (b[0].age > 200) {
            cannonBalls.delete(b[0]);
        }
    }
    let hits = drawShip(ship, cannonBalls.entries());

    ship.health -= hits * 0.01;
    for (let i = 0; i < hits; i++) {
        spawnDebris();
    }
}

function loadCannon() {
    if (ship.loadedCannons < ship.cannons) {
        ship.loadedCannons += 1 + Math.floor(ship.cannons / 4);
    }
}

function fireCannon(starboard) {
    let angle = ship.angle();
    let length = ship.length() / 2;

    let dx = (0.5 - Math.random()) * length * Math.sin(angle);
    let dy = (0.5 - Math.random()) * length * -Math.cos(angle);

    cannonBalls.add(new CannonBall(
        ship.x + dx,
        ship.y + dy,
        ship.direction + (starboard ? 90 : -90)
    ));
}

function spawnDebris() {
    debris.add(new Debris(
        ship.x + (30 * (0.5 - Math.random())),
        ship.y + (30 * (0.5 - Math.random()))));
}

let accelerate = false;
let decelerate = false;
let port = false;
let starboard = false;
let fireCannonTick = false;
let firingPortCannons = false;
let firingStarboardCannons = false;

window.onkeydown = (event) => {
    if (event.code === "ArrowUp") {
        accelerate = true;
        event.preventDefault();
    }
    if (event.code === "ArrowLeft") {
        port = true;
        event.preventDefault();
    }
    if (event.code === "ArrowRight") {
        starboard = true;
        event.preventDefault();
    }
    if (event.code === "ArrowDown") {
        decelerate = true;
        event.preventDefault();
    }
    if (event.code === "KeyA") {
        firingPortCannons = true;
        event.preventDefault();
    }
    if (event.code === "KeyS") {
        firingStarboardCannons = true;
        event.preventDefault();
    }
}
window.onkeyup = (event) => {
    if (event.code === "ArrowUp") {
        accelerate = false;
    }
    if (event.code === "ArrowLeft") {
        port = false;
    }
    if (event.code === "ArrowRight") {
        starboard = false;
    }
    if (event.code === "ArrowDown") {
        decelerate = false;
    }
    if (event.code === "KeyQ") {
        ship.cannons += 2;
    }
    if (event.code === "KeyW") {
        ship.masts += 1;
    }
    if (event.code === "KeyD") {
        spawnDebris();
    }
    if (event.code === "KeyA") {
        firingPortCannons = false;
        event.preventDefault();
    }
    if (event.code === "KeyS") {
        firingStarboardCannons = false;
        event.preventDefault();
    }
}

function handleInputs() {
    if (accelerate && ship.speed < ship.maxSpeed()) {
        ship.speed += 0.01 + (.005 * ship.masts);
    }
    if (port) {
        ship.direction -= 0.1 + (ship.speed / ship.maxSpeed()) * (1.0 + (ship.masts * 0.1));
    }
    if (starboard) {
        ship.direction += 0.1 + (ship.speed / ship.maxSpeed()) * (1.0 + (ship.masts * 0.1));
    }
    if (decelerate && ship.speed > 0) {
        ship.speed -= .01;
    }
    if (fireCannonTick && firingPortCannons && ship.loadedCannons > 0) {
        fireCannon(false);
        ship.loadedCannons -= 1;
    }
    if (fireCannonTick && firingStarboardCannons && ship.loadedCannons > 0) {
        fireCannon(true);
        ship.loadedCannons -= 1;
    }
}

function handleState() {
    if (ship.speed > 0) {
        let angle = ship.angle();

        let dx = ship.speed * Math.sin(angle);
        let dy = ship.speed * -Math.cos(angle);

        ship.x += dx;
        ship.y += dy;
    }
    for (let b of cannonBalls.entries()) {
        let angle = b[0].angle();

        let dx = 2.0 * Math.sin(angle);
        let dy = 2.0 * -Math.cos(angle);

        b[0].x += dx;
        b[0].y += dy;
        b[0].age += 1;
    }

    for (let b of cannonBalls.entries()) {

    }
}

let secondsPassed;
let oldTimeStamp;
let fps;

let reloadTick = 0;
let fireTick = 0;

function gameLoop(timeStamp) {
    secondsPassed = (timeStamp - oldTimeStamp) / 1000;
    oldTimeStamp = timeStamp;

    // Calculate fps
    fps = Math.round(1 / secondsPassed);

    if (++reloadTick > fps) {
        reloadTick = 0;
        loadCannon();
    }
    fireCannonTick = false;
    if (++fireTick > fps / ship.cannons / 2) {
        fireTick = 0;
        fireCannonTick = true;
    }

    handleInputs();
    handleState();

    drawFrame();

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 50, 20);
    ctx.font = '10px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText("FPS: " + fps, 5, 12);

    window.requestAnimationFrame(gameLoop);
}

window.requestAnimationFrame(gameLoop);
