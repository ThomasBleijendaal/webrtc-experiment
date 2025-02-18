
class AudioManager {
    static {
    }

    static audioInitialized = false;

    static cannonFireSound;
    static hitSound;
    static explodeSound;

    static init = function () {
        if (this.audioInitialized) {
            return;
        }

        this.audioInitialized = true;
        this.bufferSounds();
    }

    static preloadFile = async function (file) {
        let response = await fetch(file);
        let arrayBuffer = await response.arrayBuffer();
        let audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
        return audioBuffer;
    }

    static bufferSounds = async function () {
        this.audioCtx = new AudioContext();

        this.cannonFireSound = await this.preloadFile("/audio/cannon1.mp3");
        this.hitSound = await this.preloadFile("/audio/hit1.mp3");
        this.explodeSound = await this.preloadFile("/audio/explode1.mp3");
    }

    static playSound = function (audioBuffer, distance, randomize, offset, length) {
        if (distance > 2 * width || this.audioCtx == null) {
            return;
        }

        const trackSource = this.audioCtx.createBufferSource();
        const gain = this.audioCtx.createGain();
        trackSource.buffer = audioBuffer;
        trackSource.connect(gain);
        gain.connect(this.audioCtx.destination);

        if (randomize) {
            trackSource.detune.value = -1200 * Math.random();
        }

        gain.gain.value = Math.max(0, 1.0 - (distance / width / 4.0));

        if (distance > 1) {
            trackSource.detune.value += -1200.0 * (distance / (width / 5.0));
            gain.gain.value /= 2.0;
        }

        if (distance == 1 && audioBuffer == this.explodeSound) {
            gain.gain.value = 100;
        }

        if (offset && length) {
            trackSource.start(0, offset, Math.max(0.1, length * (1.0 - (distance / width))));
        }
        else if (offset) {
            trackSource.start(0, offset);
        }
        else {
            trackSource.start();
        }
    }

    static playCannonFire = function (distance) {
        this.playSound(this.cannonFireSound, distance, true);
    }

    static playHit = function (distance) {
        this.playSound(this.hitSound, distance, true, Math.random() * 2, 1);
    }

    static playExplode = function (distance) {
        this.playSound(this.explodeSound, distance, false, 0.45);
    }
}