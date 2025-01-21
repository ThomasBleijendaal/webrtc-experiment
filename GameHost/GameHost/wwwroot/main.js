function createMessage(type, content) { return JSON.stringify({ type: type, content: content }); };



class RtcsManager {
    static ws = new WebSocket(`ws://${location.host}/ws`);

    static pc = new RTCPeerConnection({
        iceServers: []
    });

    static dataChannel;

    static {
        this.ws.onmessage = (event) => {
            let message = JSON.parse(event.data);

            console.log("WS", message);

            if (message.type === "join") {

                let id = message.content.id;



            } else if (message.type === "offer" || message.type === "answer") {

                

                document.querySelector("#remoteSdp").value = message.content;
                this.createAnswer(message.type, message.content);

            } else if (message.type === "candidate") {

                let candidate = message.content;

                if (candidate) {
                    document.querySelector("#remoteCandidate").value = JSON.stringify(candidate);
                    this.pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
            }
        };

        this.ws.send(createMessage("join", { id: `U${performance.now().toString()}${Math.random()}` }));

        this.pc.onicecandidate = (event) => {
            console.log("ICE", event);
            if (event.type === "icecandidate" && event.candidate) {

                this.ws.send(createMessage("candidate", event.candidate));

                if (event.candidate.foundation === "0") {
                    document.querySelector("#localCandidate").value = JSON.stringify(event.candidate);
                }
            }
        };

        this.pc.ondatachannel = (event) => {
            console.log("DATACHANNEL", event);

            this.dataChannel = event.channel;

            this.dataChannel.onopen = (event) => {
                console.log("DATA", event);
            };

            this.dataChannel.onmessage = (event) => {
                console.log("MESSAGE", event);
            };
        };
    }

    static createOffer = function () {
        this.dataChannel = this.pc.createDataChannel('main-channel');

        this.dataChannel.onopen = (event) => {
            console.log("DATA", event);
        };

        this.dataChannel.onmessage = (event) => {
            console.log("MESSAGE", event);
        };

        this.pc.createOffer({
            offerToReceiveAudio: false,
            offerToReceiveVideo: false
        }).then(offer => {
            this.pc.setLocalDescription(offer);

            document.querySelector("#localSdp").value = offer.sdp;

            this.ws.send(createMessage("offer", offer.sdp));
        });
    }

    static createAnswer = function (type, sdp) {
        this.pc.setRemoteDescription({
            type: type,
            sdp: sdp
        });

        if (type === "offer") {
            this.pc.createAnswer().then(answer => {
                this.pc.setLocalDescription(answer);

                document.querySelector("#localSdp").value = answer.sdp;

                this.ws.send(createMessage("answer", answer.sdp));
            });
        }
    }

    static sendStuff = function () {
        this.dataChannel.send("HI");
    }
}

class Rtc {
    pc = new RTCPeerConnection({
        iceServers: []
    });

    dataChannel = null;

    ws = null;

    constructor(ws) {
        this.ws = ws;

        this.pc.onicecandidate = (event) => {
            console.log("ICE", event);
            if (event.type === "icecandidate" && event.candidate) {

                this.ws.send(createMessage("candidate", event.candidate));

                if (event.candidate.foundation === "0") {
                    document.querySelector("#localCandidate").value = JSON.stringify(event.candidate);
                }
            }
        };

        this.pc.ondatachannel = (event) => {
            console.log("DATACHANNEL", event);

            this.dataChannel = event.channel;

            this.dataChannel.onopen = (event) => {
                console.log("DATA", event);
            };

            this.dataChannel.onmessage = (event) => {
                console.log("MESSAGE", event);
            };
        };
    }

    createOffer = function () {
        this.dataChannel = this.pc.createDataChannel('main-channel');

        this.dataChannel.onopen = (event) => {
            console.log("DATA", event);
        };

        this.dataChannel.onmessage = (event) => {
            console.log("MESSAGE", event);
        };

        this.pc.createOffer({
            offerToReceiveAudio: false,
            offerToReceiveVideo: false
        }).then(offer => {
            this.pc.setLocalDescription(offer);

            document.querySelector("#localSdp").value = offer.sdp;

            this.ws.send(createMessage("offer", offer.sdp));
        });
    }

    createAnswer = function (type, sdp) {
        this.pc.setRemoteDescription({
            type: type,
            sdp: sdp
        });

        if (type === "offer") {
            this.pc.createAnswer().then(answer => {
                this.pc.setLocalDescription(answer);

                document.querySelector("#localSdp").value = answer.sdp;

                this.ws.send(createMessage("answer", answer.sdp));
            });
        }
    }

    sendStuff = function () {
        this.dataChannel.send("HI");
    }
}

document.querySelector("#createOffer").onclick = function () { Rtc.createOffer(); };
document.querySelector("#createAnswer").onclick = function () { Rtc.createAnswer(true); };
document.querySelector("#setAnswer").onclick = function () { Rtc.createAnswer(false); };
document.querySelector("#sendStuff").onclick = function () { Rtc.sendStuff(); };

document.querySelector("#localSdp").value = "";
document.querySelector("#remoteSdp").value = "";
document.querySelector("#localCandidate").value = "";
document.querySelector("#remoteCandidate").value = "";
