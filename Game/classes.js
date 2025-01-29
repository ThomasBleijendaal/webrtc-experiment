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
