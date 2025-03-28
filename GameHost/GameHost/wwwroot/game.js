const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const terrainCanvas = document.querySelector("#terrain");
const terrainCtx = terrainCanvas.getContext("2d", { alpha: false });

const width = canvas.width;
const height = canvas.height;

const ship = new Ship();
ship.reset();

const debris = new Set();
const cannonBalls = new Set();
const smoke = new Set();
const trail = new Set();
const events = new Set();
const cannonFireEvent = 1;
const hitEvent = 2;
const explodeEvent = 3;

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

function addTrail() {
    trail.add(new Trail(ship.x, ship.y, 0));
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
    state.trail = [...trail];
    state.events = [...events];

    networkGameState = JSON.stringify(state);

    events.clear();
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
let addTrailTick = false;

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
                ship.healthRemaining = Math.min(ship.healthRemaining + 1, ship.maxHealth());
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
    if (addTrailTick) {
        addTrail();
    }
}

function handleDamage(hits) {
    if (hits == 0) {
        return;
    }

    if (hits == -1) {
        ship.healthRemaining = -1;
    }
    else {
        ship.healthRemaining -= hits * 0.01;
        for (let i = 0; i < hits; i++) {
            spawnDebris();

            AudioManager.playHit(1);

            events.add(hitEvent);
        }
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
    for (let [b,] of cannonBalls.entries()) {
        let angle = b.angle();

        let dx = fpsFactor * 2.0 * Math.sin(angle);
        let dy = fpsFactor * 2.0 * -Math.cos(angle);

        b.x += dx;
        b.y += dy;
        b.age += fpsFactor;

        let terrainHeight = getDepth(b.x, b.y);

        if (terrainHeight > 3) {
            b.age = 10000;

            smoke.add(new Smoke(
                b.x,
                b.y));
        }

        if (b.x < -30) {
            b.x = width + 29;
        }
        if (b.x > width + 30) {
            b.x = -29;
        }
        if (b.y < -30) {
            b.y = height + 29;
        }
        if (b.y > height + 30) {
            b.y = -29;
        }
    }
    for (let s of smoke.entries()) {
        s[0].age += .1 * fpsFactor;
    }
    for (let t of trail.entries()) {
        t[0].age += .1 * fpsFactor;
    }
}

let secondsPassed;
let oldTimeStamp;
let fps;

let reloadTick = 0;
let fireTick = 0;
let trailTick = 0;

let showFps = false;
let fpss = [];

function gameLoop(timeStamp) {
    secondsPassed = (timeStamp - oldTimeStamp) / 1000.0;
    oldTimeStamp = timeStamp;

    // Calculate fps
    fps = Math.round(1.0 / secondsPassed);
    if (fps == 0) {
        fps = 1;
    }

    fpss.push(fps);
    while (fpss.length > 100) {
        fpss.shift();
    }

    let fpsFactor = Math.max(0.1, Math.min(3.0, 60.0 / fps));

    if (++reloadTick > fps) {
        reloadTick = 0;
        loadCannon();
    }
    fireCannonTick = false;
    if (++fireTick > 1) {
        fireTick = 0;
        fireCannonTick = true;
    }
    addTrailTick = false;
    if (ship.speed > 0 && ++trailTick > (fps / ship.speed / 4)) {
        trailTick = 0;
        addTrailTick = true;
    }

    handleInputs(fpsFactor);
    handleState(fpsFactor);

    drawFrame();

    if (showFps) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 50, 20);
        ctx.font = '10px Arial';
        ctx.fillStyle = 'black';
        ctx.fillText("FPS: " + fps, 5, 12);

        let i = 0;
        ctx.fillStyle = 'black';
        for (let f of fpss) {
            ctx.fillRect(++i, 200 - f, 1, 1);
        }
    }

    prepareState();
    RtcsManager.sendState();

    window.requestAnimationFrame(gameLoop);
}

initTerrain();

window.requestAnimationFrame(gameLoop);
