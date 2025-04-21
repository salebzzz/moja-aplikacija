const socket = io();

let localStream;
let remoteStream;
let peerConnection;
const config = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
};

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const subtitles = document.getElementById("subtitles");

let roomName = "";

async function joinRoom() {
    roomName = document.getElementById("roomInput").value;
    if (!roomName) {
        alert("Unesite naziv sobe!");
        return;
    }

    socket.emit("join", roomName);

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    createPeerConnection();

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
}

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(config);

    peerConnection.ontrack = (event) => {
        if (!remoteStream) {
            remoteStream = new MediaStream();
            remoteVideo.srcObject = remoteStream;
        }
        remoteStream.addTrack(event.track);
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("ice-candidate", {
                room: roomName,
                candidate: event.candidate
            });
        }
    };
}

// Socket događaji
socket.on("offer", async (data) => {
    if (!peerConnection) createPeerConnection();

    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("answer", { room: roomName, answer });
});

socket.on("answer", async (data) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

socket.on("ice-candidate", async (data) => {
    try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (e) {
        console.error("Greška sa ICE kandidatom:", e);
    }
});

socket.on("ready", async () => {
    if (peerConnection.signalingState === "stable") return;

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit("offer", { room: roomName, offer });
});
