function drawSea() {
    ctx.beginPath();
    ctx.clearRect(0, 0, width, height);
}

/**
 * *
 * @param {NetworkShip} ship
 * @param {any} cannonBalls
 * @returns
 */
function drawShip(ship, cannonBalls, otherShips) {
    let cannonBallsHit = 0;
    let shipsHit = 0;

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

    ctx.translate(ship.x, ship.y);

    ctx.fillStyle = ship.color;

    ctx.rotate(shipAngle);
    ctx.translate(-halfWidth, -halfLength);

    ctx.fill(shipPath);

    for (let b of cannonBalls) {
        if (ctx.isPointInPath(shipPath, b.x, b.y)) {
            cannonBallsHit++;
        }
    }
    for (let s of otherShips) {
        if (ctx.isPointInPath(shipPath, s.x, s.y)) {
            shipsHit++;
        }
    }

    ctx.translate(-halfWidth, halfLength);
    ctx.fillStyle = "black";
    ctx.rect(halfWidth, 7 - halfLength, 2, shipLength - 10);

    ctx.translate(shipWidth, 0);

    ctx.rect(halfWidth - 2, 7 - halfLength, 2, shipLength - 10);
    ctx.fill();

    ctx.rotate(-shipAngle);

    ctx.font = '12px monospace';
    ctx.fillStyle = 'white';
    ctx.fillText(`${Math.floor(ship.health() * 100)}%`, -14, -14);

    let nameLength = ship.name.length;

    let shipDepth = getDepth(ship.x, ship.y);

    let terrainHit = shipDepth < 2 ? 0 : shipDepth;

    ctx.fillText(ship.name, -3.2 * nameLength, 24);

    ctx.translate(-ship.x, -ship.y);

    if (shipDepth > 3) {
        return -1;
    }

    return cannonBallsHit + (shipsHit * 10) + (terrainHit);
}

/**
 * *
 * @param {NetworkShip} ship
 * @param {any} cannonBalls
 * @returns
 */
function drawHighlight(ship) {
    ctx.beginPath();

    ctx.translate(ship.x, ship.y);

    ctx.globalAlpha = 0.2;
    ctx.fillStyle =  "#ffffff";
    ctx.arc(0, 0, 30, 0, 2 * Math.PI);
    ctx.fill();

    ctx.globalAlpha = 1;

    ctx.translate(-ship.x, -ship.y);
}

function drawUpgrades(ship) {
    ctx.beginPath();

    ctx.translate(width - 20, 20);

    ctx.fillStyle = "gold";
    ctx.arc(0, 0, 20, 0, 2 * Math.PI);
    ctx.fill();

    ctx.font = '15px monospace';
    ctx.fillStyle = 'black';
    ctx.fillText(ship.upgrades, ship.upgrades > 9 ? -8 : -4, 4);

    ctx.translate(-width + 20, -20);
}

function drawDebris(debris, ship) {
    ctx.beginPath();
    ctx.fillStyle = ship.color;

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

function drawSmoke(smoke) {
    let r1 = smoke.x % 4;
    let r2 = smoke.y % 5;

    let radius = (smoke.age < 5)
        ? 2.5 + (smoke.age) 
        : 5 + (smoke.age / 2);

    ctx.beginPath();
    if (smoke.age <= 1) {
        ctx.fillStyle = "#ffeedd";
        ctx.globalAlpha = 1;
    }
    else {
        let color = `#c${Math.ceil(r1)}c${Math.ceil(r2)}c${Math.ceil(r1+r2)}`;
        ctx.fillStyle = color;
        ctx.globalAlpha = Math.max(0, 0.5 - (smoke.age / 200.0));
    }

    ctx.translate(smoke.x, smoke.y);

    ctx.arc(0, 0, radius, 0, 2 * Math.PI)
    ctx.fill();

    ctx.translate(-smoke.x, -smoke.y);

    ctx.translate(smoke.x - r1, smoke.y + r2);

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI)
    ctx.fill();

    ctx.translate(-smoke.x + r1, -smoke.y - r2);

    ctx.translate(smoke.x + r2, smoke.y);

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI)
    ctx.fill();

    ctx.translate(-smoke.x - r2, -smoke.y);
    ctx.globalAlpha = 1.0;
}

function drawTrail(trail, ship) {
    let r = (ship.width() / 2) + trail.age;

    ctx.beginPath();

    ctx.translate(trail.x, trail.y);

    ctx.fillStyle = `#a0c0ff`;
    ctx.globalAlpha = Math.max(0, 0.5 - (trail.age / 20.0));

    ctx.arc(0, 0, r, 0, 2 * Math.PI)
    ctx.fill();

    ctx.translate(-trail.x, -trail.y);
    ctx.globalAlpha = 1.0;
}

function drawFrame() {
    drawSea();
    if (ship.healthRemaining > 0) {
        drawHighlight(ship);
    }

    drawUpgrades(ship);

    for (let t of trail.entries()) {
        drawTrail(t[0], ship);

        if (t[0].age > 10) {
            trail.delete(t[0]);
        }
    }

    for (let d of debris.entries()) {
        drawDebris(d[0], ship);

        if (Math.random() <= 0.005) {
            debris.delete(d[0]);
        }
    }

    for (let b of cannonBalls.entries()) {
        drawCannonBall(b[0]);

        if (b[0].age > b[0].maxAge) {
            cannonBalls.delete(b[0]);
        }
    }

    for (let [id, remoteState] of Object.entries(otherGameStates)) {
        if (remoteState.debris) {
            for (let d of remoteState.debris) {
                drawDebris(d, remoteState.ship);
            }
        }

        if (remoteState.cannonBalls) {
            for (let b of remoteState.cannonBalls) {
                drawCannonBall(b);
            }
        }

        if (remoteState.trail) {
            for (let t of remoteState.trail) {
                drawTrail(t, remoteState.ship);
            }
        }

        if (remoteState.ship && remoteState.ship.health() > 0) {
            drawShip(remoteState.ship, [], []);
        };

        
        if (!RtcsManager.peers[id]) {
            delete otherGameStates[id];
        }
    }

    if (ship.healthRemaining > 0) {
        let gameStates = Object.values(otherGameStates);

        let hits = drawShip(ship,
            gameStates.flatMap(x => x.cannonBalls),
            gameStates.map(x => x.ship));
        handleDamage(hits);
    }

    for (let s of smoke.entries()) {
        drawSmoke(s[0]);

        if (s[0].age >= 95) {
            smoke.delete(s[0]);
        }
    }

    for (let [id, remoteState] of Object.entries(otherGameStates)) {
        if (remoteState.smoke) {
            for (let s of remoteState.smoke) {
                drawSmoke(s);
            }
        }
    }
}
