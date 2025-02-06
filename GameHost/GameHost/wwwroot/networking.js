function createMessage(type, from, to, content) { return JSON.stringify({ type: type, from: from, to: to, content: content }); };

class RtcsManager {
    static ws = null;

    static id = `U${Date.now()}${Math.random()}`;

    static peers = {};

    static dataChannel;

    static {
        this.ws = new WebSocket(`ws://${location.host}/ws`);

        this.ws.onmessage = (event) => {
            let message = JSON.parse(event.data);

            let from = message.from;
            let to = message.to;

            if (to != null && to != this.id) {
                return;
            }

            if (message.type === "join") {

                let newPeer = new Rtc(this.ws, from, this.id);

                newPeer.createOffer();

                console.log("JOIN", from);

                this.peers[from] = newPeer;

            } else if (message.type === "offer") {

                if (!this.peers[from]) {
                    console.log("OFFER", from);
                    this.peers[from] = new Rtc(this.ws, from, this.id);
                    this.peers[from].handleRemote(message.type, message.content);
                }

            } else if (message.type === "answer") {

                if (this.peers[from]) {
                    if (this.peers[from].isConnected()) {
                        console.log("ALREADY KNOWN", from);
                    }
                    else {
                        this.peers[from].handleRemote(message.type, message.content);
                    }
                }
                
            } else if (message.type === "candidate") {

                let candidate = message.content;

                if (candidate) {
                    if (this.peers[from]) {
                        console.log("CANDIDATE", from, message.content);
                        this.peers[from].addCandicate(message.content);
                    }
                }
            }
        };

        this.ws.onopen = (event) => {
            this.ws.send(createMessage("join", this.id, null, { id: this.id }));
        }
    }

    static remove = function (peerId) {
        if (peerId) {
            this.peers[peerId] = null;
        }
    }

    static sendState = function () {
        for (let peer of Object.values(this.peers)) {
            if (peer) {
                peer.sendState();
            }
        }
    }
}

class Rtc {
    remote = null;
    local = null;

    pc = null;

    dataChannel = null;

    ws = null;

    constructor(ws, remote, local) {
        this.remote = remote;
        this.local = local;

        this.pc = new RTCPeerConnection({
            iceServers: []
        });

        this.ws = ws;

        this.pc.onicecandidate = (event) => {
            console.log("ICE", event);
            if (event.type === "icecandidate" && event.candidate) {
                this.ws.send(createMessage("candidate", this.local, this.remote, event.candidate));
            }
        };

        this.pc.onconnectionstatechange = (event) => {
            console.log("CONNECTION CHANGE", event, this.pc.connectionState);

            if (this.pc.connectionState == "closed" || this.pc.connectionState == "failed" || this.pc.connectionState == "disconnected") {
                RtcsManager.remove(this.remote);
            }
        };

        this.pc.ondatachannel = (event) => {
            this.dataChannel = event.channel;
            this.setupChannel();
        };
    }

    createOffer = function () {
        this.dataChannel = this.pc.createDataChannel('main-channel');
        this.setupChannel();

        this.pc.createOffer({
            offerToReceiveAudio: false,
            offerToReceiveVideo: false
        }).then(offer => {
            this.pc.setLocalDescription(offer);

            this.ws.send(createMessage("offer", this.local, this.remote, offer.sdp));
        });
    }

    isConnected = function () {
        return this.pc.signalingState === "stable";
    }

    handleRemote = function (type, sdp) {
        this.pc.setRemoteDescription({
            type: type,
            sdp: sdp
        });

        if (type === "offer") {
            this.pc.createAnswer().then(answer => {
                this.pc.setLocalDescription(answer);

                this.ws.send(createMessage("answer", this.local, this.remote, answer.sdp));
            });
        }
    }

    setupChannel = function () {
        this.dataChannel.onmessage = (event) => {
            let remoteState = JSON.parse(event.data);

            if (!otherGameStates[this.remote]) {
                otherGameStates[this.remote] = new NetworkState();
            }

            otherGameStates[this.remote].ship.color = remoteState.ship.color;
            otherGameStates[this.remote].ship.name = remoteState.ship.name;
            otherGameStates[this.remote].ship.x = remoteState.ship.x;
            otherGameStates[this.remote].ship.y = remoteState.ship.y;
            otherGameStates[this.remote].ship._angle = remoteState.ship._angle;
            otherGameStates[this.remote].ship._length = remoteState.ship._length;
            otherGameStates[this.remote].ship._width = remoteState.ship._width;
            otherGameStates[this.remote].ship._health = remoteState.ship._health;

            otherGameStates[this.remote].debris = remoteState.debris.map(x => new NetworkParticle(x.x, x.y));
            otherGameStates[this.remote].cannonBalls = remoteState.cannonBalls.map(x => new NetworkParticle(x.x, x.y));
            otherGameStates[this.remote].smoke = remoteState.smoke.map(x => new Smoke(x.x, x.y, x.age));
            otherGameStates[this.remote].events = remoteState.events;

            if (remoteState.events.length > 0) {
                let dx = remoteState.ship.x - ship.x;
                let dy = remoteState.ship.y - ship.y;
                let distance = Math.sqrt((dx * dx) + (dy * dy));

                for (let event of remoteState.events) {
                    if (event == cannonFireEvent) {
                        AudioManager.playCannonFire(distance);
                    }
                    else if (event == hitEvent) {
                        AudioManager.playHit(distance);
                    }
                    else if (event == explodeEvent) {
                        AudioManager.playExplode(distance);
                        ship.upgrades++;
                    }
                }
            }
        };
    }

    addCandicate = function (candidate) {
        if (candidate) {
            this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }

    sendState = function () {
        if (this.dataChannel) {
            try {
                this.dataChannel.send(networkGameState);
            }
            catch {
                RtcsManager.remove(this.pc.remote);
            }
        }
    }
}
