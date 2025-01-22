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
    cannons = 2;
    health = 10;

    maxSpeed = function() {
        return this.masts * 1.2;
    }
    angle = function() {
        return this.direction * Math.PI / 180.0;
    }
}

const ship = new Ship();

function drawSea() {
    ctx.beginPath();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#3040d0"
    ctx.rect(0, 0, width, height);
    ctx.fill();
}

function drawShip(ship) {
    let shipAngle = ship.angle();
    let shipWidth = 10 + (ship.cannons / 4);
    let shipLength = 25 + (ship.masts * 5);

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
    
    // TODO: add masts and cannons

    ctx.translate(halfWidth, halfLength);
    ctx.rotate(-shipAngle);
    ctx.translate(-ship.x, -ship.y);
}

function drawFrame() {
    drawSea();
    drawShip(ship);
}

document.querySelector("#rotate").onclick = (event) => {
    ship.direction += 10;
}
document.querySelector("#cannons").onclick = (event) => {
    ship.cannons += 2;
}
document.querySelector("#masts").onclick = (event) => {
    ship.masts += 1;
}

let accelerate = false;
let decelerate = false;
let port = false;
let starboard = false;

window.onkeydown = (event) => {
    if (event.key == "ArrowUp") {
        accelerate = true;
        event.preventDefault();
    }
    if (event.key == "ArrowLeft") {
        port = true;
        event.preventDefault();
    }
    if (event.key == "ArrowRight") {
        starboard = true;
        event.preventDefault();
    }
    if (event.key == "ArrowDown") {
        decelerate = true;
        event.preventDefault();
    }
}
window.onkeyup = (event) => {
    if (event.key == "ArrowUp") {
        accelerate = false;
    }
    if (event.key == "ArrowLeft") {
        port = false;
    }
    if (event.key == "ArrowRight") {
        starboard = false;
    }
    if (event.key == "ArrowDown") {
        decelerate = false;
    }
}

function handleInputs() {
    if (accelerate && ship.speed < ship.maxSpeed()) {
        ship.speed += .1;
    }
    if (port) {
        ship.direction -= (1 - (0.1 * ship.masts));
    }
    if (starboard) {
        ship.direction +=  (1 - (0.1 * ship.masts));
    }
    if (decelerate && ship.speed > 0) {
        ship.speed -= .11;
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
}

let secondsPassed;
let oldTimeStamp;
let fps;


function gameLoop(timeStamp) {
    secondsPassed = (timeStamp - oldTimeStamp) / 1000;
    oldTimeStamp = timeStamp;

    // Calculate fps
    fps = Math.round(1 / secondsPassed);

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
