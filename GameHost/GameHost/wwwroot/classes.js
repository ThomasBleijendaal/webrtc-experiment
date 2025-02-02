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
    _health = 1;

    angle = function () {
        return this._angle;
    }
    length = function () {
        return this._length;
    }
    width = function () {
        return this._width;
    }
    health = function () {
        return this._health;
    }
}

class Ship extends NetworkShip {
    color = `#${Math.floor(Math.random() * 80 + 10)}${Math.floor(Math.random() * 50 + 10)}00`;

    direction = 0;
    speed = 0;

    masts = 1;
    cannons = 4;
    loadedCannons = 0;
    healthRemaining = 2;

    upgrades = 2;

    maxSpeed = function () {
        return 1 + (this.masts * 0.1);
    }
    angle = function () {
        return this.direction * Math.PI / 180.0;
    }
    length = function () {
        return 15 + (this.masts * 3);
    }
    width = function () {
        return 10 + (this.cannons / 10);
    }
    health = function () {
        return this.healthRemaining / (this.maxHealth());
    }
    maxHealth = function () {
        return this.masts * 2;
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
