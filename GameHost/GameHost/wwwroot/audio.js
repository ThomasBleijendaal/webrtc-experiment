
class AudioManager {
    static {
    }

    static audioInitialized = false;

    static cannonFireSound;
    static hitSound;

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
    }

    static playSound = function (audioBuffer, volume, detune, offset, length) {
        const trackSource = this.audioCtx.createBufferSource();
        const gain = this.audioCtx.createGain();
        trackSource.buffer = audioBuffer;
        trackSource.connect(gain);
        gain.connect(this.audioCtx.destination);

        if (detune) {
            trackSource.detune.value = 2400 * (0.5 - Math.random());
        }

        gain.gain.value = volume;

        if (offset && length) {
            trackSource.start(0, offset, length);
        }
        else {
            trackSource.start();
        }
    }

    static playCannonFire = function (volume) {
        this.playSound(this.cannonFireSound, volume, true);
    }

    static playHit = function (volume) {
        this.playSound(this.hitSound, volume, true, Math.random() * 2, 1);
    }
}