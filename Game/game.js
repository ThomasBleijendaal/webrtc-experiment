const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;


const ship = new Ship();
const debris = new Set();
const cannonBalls = new Set();

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
