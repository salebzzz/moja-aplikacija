console.log("✅ script.js se učitao!");

var socket = io.connect('http://127.0.0.1:5000');

let localStream;
let remoteStream;
let peerConnection;
const servers = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
    ]
};

document.addEventListener("DOMContentLoaded", function () {
    console.log("🔍 DOM sadržaj učitan.");

    // Pronalazimo sve potrebne HTML elemente
    const chatBox = document.getElementById("chat-box");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");
    const startCallButton = document.getElementById("start-call");
    const endCallButton = document.getElementById("end-call");
    const localVideo = document.getElementById("localVideo");
    const remoteVideo = document.getElementById("remoteVideo");

    // Provera da li svi elementi postoje
    if (!chatBox || !messageInput || !sendButton || !startCallButton || !endCallButton || !localVideo || !remoteVideo) {
        console.error("⚠️ Neki od ključnih elemenata NIJE pronađen! Proveri HTML.");
        return;
    }

    console.log("✅ Svi elementi su pronađeni.");

    // WebSocket konekcija
    socket.on("connect", function () {
        console.log("✅ Povezan na WebSocket server.");
    });

    socket.on("message", function (msg) {
        console.log("📩 Primljena poruka:", msg);
        displayMessage(msg, "received");
    });

    function sendMessage() {
        let msg = messageInput.value.trim();
        if (msg === "") return;
        displayMessage(msg, "sent");
        socket.send(msg);
        messageInput.value = "";
    }

    function displayMessage(text, type) {
        let messageDiv = document.createElement("div");
        messageDiv.classList.add("chat-message", type);
        messageDiv.textContent = text;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    sendButton.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    // Start video poziva
    startCallButton.addEventListener("click", async () => {
        console.log("✅ Dugme 'Pokreni poziv' je kliknuto!");

        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = localStream;
            console.log("✅ Kamera i mikrofon uključeni.");

            peerConnection = new RTCPeerConnection(servers);
            remoteStream = new MediaStream();
            remoteVideo.srcObject = remoteStream;

            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

            peerConnection.ontrack = event => {
                event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
            };

            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    socket.emit("ice-candidate", event.candidate);
                }
            };

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit("offer", offer);
            console.log("📡 Poslata ponuda:", offer);
        } catch (error) {
            console.error("⚠️ Greška pri uključivanju kamere:", error);
            alert("Ne možemo uključiti kameru. Proveri dozvole!");
        }
    });

    // Prekid video poziva
    endCallButton.addEventListener("click", () => {
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }
        localVideo.srcObject = null;
        remoteVideo.srcObject = null;
        console.log("📴 Poziv prekinut.");
    });

    socket.on("offer", async offer => {
        console.log("📡 Primljena ponuda:", offer);
        peerConnection = new RTCPeerConnection(servers);
        remoteStream = new MediaStream();
        remoteVideo.srcObject = remoteStream;

        peerConnection.ontrack = event => {
            event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
        };

        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                socket.emit("ice-candidate", event.candidate);
            }
        };

        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("answer", answer);
        console.log("✅ Poslat odgovor:", answer);
    });

    socket.on("answer", async answer => {
        console.log("✅ Primljen odgovor:", answer);
        if (peerConnection) {
            await peerConnection.setRemoteDescription(answer);
        }
    });

    socket.on("ice-candidate", async candidate => {
        console.log("❄️ Primljen ICE kandidat:", candidate);
        if (peerConnection) {
            await peerConnection.addIceCandidate(candidate);
        }
    });

    // Provera da li kamera radi
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => console.log("✅ Kamera funkcioniše!"))
        .catch(error => console.error("⚠️ Greška prilikom pokretanja kamere:", error));
});
peerConnection.onicecandidate = event => {
    if (event.candidate) {
        console.log("📡 Slanje ICE kandidata:", event.candidate);
        socket.emit("ice-candidate", event.candidate);
    } else {
        console.log("🚫 Nema više ICE kandidata.");
    }
};
socket.on("ice-candidate", async candidate => {
    console.log("❄️ Primljen ICE kandidat:", candidate);
    if (peerConnection) {
        try {
            await peerConnection.addIceCandidate(candidate);
            console.log("✅ ICE kandidat dodat.");
        } catch (error) {
            console.error("⚠️ Greška pri dodavanju ICE kandidata:", error);
        }
    }
});
navigator.permissions.query({ name: "camera" }).then(permission => {
    console.log("📷 Status dozvole kamere:", permission.state);
});

navigator.permissions.query({ name: "microphone" }).then(permission => {
    console.log("🎤 Status dozvole mikrofona:", permission.state);
});
