class Rtc {
    static pc = new RTCPeerConnection({
        iceServers: []
    });

    static dataChannel;

    static {
        this.pc.onicecandidate = (event) => {
            console.log("ICE", event);

            if (event.type === "icecandidate" && event.candidate && event.candidate.foundation === "0") {
                document.querySelector("#localCandidate").value = JSON.stringify(event.candidate);
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
            offerToReceiveAudio: false
        }).then(offer => {
            this.pc.setLocalDescription(offer);

            document.querySelector("#localSdp").value = offer.sdp;
        });
    }

    static createAnswer = function (isOffer) {
        let sdp = document.querySelector("#remoteSdp").value;

        this.pc.setRemoteDescription({
            type: isOffer ? "offer" : "answer",
            sdp: sdp
        });

        if (isOffer) {
            this.pc.createAnswer().then(answer => {
                this.pc.setLocalDescription(answer);

                let candidate = document.querySelector("#remoteCandidate").value;

                this.pc.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));

                document.querySelector("#localSdp").value = answer.sdp;
            });
        }
        else {
            let candidate = document.querySelector("#remoteCandidate").value;

            this.pc.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
        }
    }

    static sendStuff = function () {
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
