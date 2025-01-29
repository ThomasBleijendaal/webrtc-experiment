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
