const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;

const ship = new Ship();
ship.reset();

const debris = new Set();
const cannonBalls = new Set();
const smoke = new Set();
const events = new Set();
const cannonFireEvent = 1;
const hitEvent = 2;
const explodeEvent = 3;

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
    let ballDirection = ship.direction + (starboard ? 90 : -90) + (10 * (0.5 - Math.random()));
    let ballAngle = ballDirection * Math.PI / 180.0

    let sdx = ship.width() / 2 * Math.sin(ballAngle);
    let sdy = ship.width() / 2 * -Math.cos(ballAngle);

    let newBall = new CannonBall(
        ship.x + dx + sdx,
        ship.y + dy + sdy,
        ballDirection,
        50 + (150 * Math.random())
    );

    cannonBalls.add(newBall);

    smoke.add(new Smoke(
        newBall.x,
        newBall.y
    ));

    AudioManager.playCannonFire(1);
    events.add(cannonFireEvent);
}

function spawnDebris() {
    let length = Math.random() * 30;
    let direction = Math.random() * 2 * Math.PI;

    let dx = length * Math.sin(direction);
    let dy = length * -Math.cos(direction);

    debris.add(new Debris(
        ship.x + dx,
        ship.y + dy));
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
    state.smoke = [...smoke];
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

    if (ship.healthRemaining > 0) {
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
}
window.onkeyup = (event) => {
    if (ship.healthRemaining > 0) {
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
    else if (event.code === "KeyR") {
        ship.reset();
    }
}

function handleInputs(fpsFactor) {
    if (accelerate && ship.speed < ship.maxSpeed()) {
        ship.speed += fpsFactor * 0.01 + (.005 * ship.masts);
    }
    if (port) {
        ship.direction -= fpsFactor * (0.1 + (ship.speed / ship.maxSpeed()) * (1.0 + (ship.masts * 0.1)));
    }
    if (starboard) {
        ship.direction += fpsFactor * (0.1 + (ship.speed / ship.maxSpeed()) * (1.0 + (ship.masts * 0.1)));
    }
    if (decelerate && ship.speed > 0) {
        ship.speed -= fpsFactor * .01;
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

    if (ship.healthRemaining <= 0) {
        AudioManager.playExplode(1);

        for (let i = 0; i < 25; i++) {
            spawnDebris();
        }

        events.add(explodeEvent);

        ship.speed = 0;
        ship.x = -100;
        ship.y = -100;

        accelerate = false;
        decelerate = false;
        port = false;
        starboard = false;
        firingPortCannons = false;
        firingStarboardCannons = false;
    }
}

function handleState(fpsFactor) {
    if (ship.speed > 0) {
        let angle = ship.angle();

        let dx = fpsFactor * ship.speed * Math.sin(angle);
        let dy = fpsFactor * ship.speed * -Math.cos(angle);

        ship.x += dx;
        ship.y += dy;

        if (ship.x < -30) {
            ship.x = width + 29;
            handleDamage(10);
        }
        if (ship.x > width + 30) {
            ship.x = -29;
            handleDamage(10);
        }
        if (ship.y < -30) {
            ship.y = height + 29;
            handleDamage(10);
        }
        if (ship.y > height + 30) {
            ship.y = -29;
            handleDamage(10);
        }
    }
    for (let b of cannonBalls.entries()) {
        let angle = b[0].angle();

        let dx = fpsFactor * 2.0 * Math.sin(angle);
        let dy = fpsFactor * 2.0 * -Math.cos(angle);

        b[0].x += dx;
        b[0].y += dy;
        b[0].age += fpsFactor;

        if (b[0].x < -30) {
            b[0].x = width + 29;
        }
        if (b[0].x > width + 30) {
            b[0].x = -29;
        }
        if (b[0].y < -30) {
            b[0].y = height + 29;
        }
        if (b[0].y > height + 30) {
            b[0].y = -29;
        }
    }
    for (let s of smoke.entries()) {
        s[0].age += .1 * fpsFactor;
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
    if (fps == 0) {
        fps = 1;
    }

    let fpsFactor = Math.max(0.1, Math.min(3.0, 60.0 / fps));

    if (++reloadTick > fps) {
        reloadTick = 0;
        loadCannon();
    }
    fireCannonTick = false;
    if (++fireTick > fps / ship.cannons / 2) {
        fireTick = 0;
        fireCannonTick = true;
    }

    handleInputs(fpsFactor);
    handleState(fpsFactor);

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
