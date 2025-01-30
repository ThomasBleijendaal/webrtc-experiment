class NetworkState {
    ship = new NetworkShip();
    debris = [];
    cannonBalls = [];
}

class NetworkParticle {
    x = 0;
    y = 0;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class NetworkShip extends NetworkParticle {
    color = "red";

    _angle = 0;
    _length = 0;
    _width = 0;

    angle = function () {
        return this._angle;
    }
    length = function () {
        return this._length;
    }
    width = function () {
        return this._width;
    }
}

class Ship extends NetworkShip {
    color = "red";

    direction = 0;
    speed = 0;

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

class Debris extends NetworkParticle {
}

class CannonBall extends NetworkParticle {
    direction = 0;
    age = 0;

    constructor(x, y, direction) {
        super(x, y);

        this.direction = direction;
    }

    angle = function () {
        return this.direction * Math.PI / 180.0;
    }
}
