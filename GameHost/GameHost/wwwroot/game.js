const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;

const ship = new Ship(0.9 * Math.random() * width + 10, 0.9 * Math.random() * height + 10);
ship.direction = ((ship.x > width / 2) ? 270 : 90) + ((ship.y > height / 2) ? 90 : 0)

const debris = new Set();
const cannonBalls = new Set();
const events = new Set();
const cannonFireEvent = 1;
const hitEvent = 2;

// TODO: remove state of clients that are gone
const otherGameStates = {};

let networkGameState = "";

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

    AudioManager.playCannonFire(1);
    events.add(cannonFireEvent);
}

function spawnDebris() {
    debris.add(new Debris(
        ship.x + (30 * (0.5 - Math.random())),
        ship.y + (30 * (0.5 - Math.random()))));
}

function prepareState() {
    let state = new NetworkState();
    state.ship.color = ship.color;
    state.ship.name = ship.name;
    state.ship.x = ship.x;
    state.ship.y = ship.y;
    state.ship._angle = ship.angle();
    state.ship._length = ship.length();
    state.ship._width = ship.width();
    state.ship._health = ship.health();

    state.debris = [...debris].map(x => new NetworkParticle(x.x, x.y));
    state.cannonBalls = [...cannonBalls].map(x => new NetworkParticle(x.x, x.y));
    state.events = [...events];

    networkGameState = JSON.stringify(state);

    events.clear();

    //console.log(networkGameState);
}

function receiveState(id, state) {
    console.log(state);

    otherGameStates[id] = state;
}

let accelerate = false;
let decelerate = false;
let port = false;
let starboard = false;
let fireCannonTick = false;
let firingPortCannons = false;
let firingStarboardCannons = false;

let nameInput = document.querySelector("#name");

nameInput.onchange = (event) => {
    ship.name = nameInput.value;
};

window.onkeydown = (event) => {
    AudioManager.init();

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
    }
    else if (event.code === "KeyS") {
        firingStarboardCannons = true;
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
        if (ship.upgrades > 0) {
            ship.cannons += 2;
            ship.upgrades--;
        }
    }
    if (event.code === "KeyW") {
        if (ship.upgrades > 0) {
            ship.masts += 1;
            ship.upgrades--;
        }
    }
    if (event.code === "KeyE") {
        if (ship.upgrades > 0) {
            ship.healthRemaining = ship.maxHealth();
            ship.upgrades--;
        }
    }
    if (event.code === "KeyA") {
        firingPortCannons = false;
    }
    if (event.code === "KeyS") {
        firingStarboardCannons = false;
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

function handleDamage(hits) {
    if (hits == 0) {
        return;
    }

    ship.healthRemaining -= hits * 0.01;
    for (let i = 0; i < hits; i++) {
        spawnDebris();

        AudioManager.playHit(1);

        events.add(hitEvent);
    }
}

function handleState() {
    if (ship.speed > 0) {
        let angle = ship.angle();

        let dx = ship.speed * Math.sin(angle);
        let dy = ship.speed * -Math.cos(angle);

        ship.x += dx;
        ship.y += dy;

        if (ship.x < -30) {
            ship.x = height + 29;
            handleDamage(10);
        }
        if (ship.x > height + 30) {
            ship.x = -29;
            handleDamage(10);
        }
        if (ship.y < -30) {
            ship.y = width + 29;
            handleDamage(10);
        }
        if (ship.y > width + 30) {
            ship.y = -29;
            handleDamage(10);
        }
    }
    for (let b of cannonBalls.entries()) {
        let angle = b[0].angle();

        let dx = 2.0 * Math.sin(angle);
        let dy = 2.0 * -Math.cos(angle);

        b[0].x += dx;
        b[0].y += dy;
        b[0].age += 1;

        if (b[0].x < -30) {
            b[0].x = height + 29;
        }
        if (b[0].x > height + 30) {
            b[0].x = -29;
        }
        if (b[0].y < -30) {
            b[0].y = width + 29;
        }
        if (b[0].y > width + 30) {
            b[0].y = -29;
        }
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

    prepareState();
    RtcsManager.sendState();

    window.requestAnimationFrame(gameLoop);
}

window.requestAnimationFrame(gameLoop);
