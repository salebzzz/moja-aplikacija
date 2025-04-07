console.log("✅ script.js se učitao!");

var socket = io.connect('http://192.168.2.50:5000');

let isCaller = false;
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

    const chatBox = document.getElementById("chat-box");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");
    const startCallButton = document.getElementById("start-call");
    const endCallButton = document.getElementById("end-call");
    const localVideo = document.getElementById("localVideo");
    const remoteVideo = document.getElementById("remoteVideo");

    if (!chatBox || !messageInput || !sendButton || !startCallButton || !endCallButton || !localVideo || !remoteVideo) {
        console.error("⚠️ Neki od ključnih elemenata NIJE pronađen! Proveri HTML.");
        return;
    }

    console.log("✅ Svi elementi su pronađeni.");

    socket.on("connect", () => console.log("✅ Povezan na WebSocket server."));

    socket.on("message", (msg) => {
        console.log("📩 Primljena poruka:", msg);
        displayMessage(msg, "received");
    });

    sendButton.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    startCallButton.addEventListener("click", async () => {
        isCaller = true;
        console.log("✅ Dugme 'Pokreni poziv' je kliknuto!");
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = localStream;
            console.log("✅ Kamera i mikrofon uključeni.");

            peerConnection = createPeerConnection();
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit("offer", offer);
            console.log("📡 Poslata ponuda:", offer);
        } catch (error) {
            console.error("⚠️ Greška pri uključivanju kamere:", error);
            alert("Ne možemo uključiti kameru. Proveri dozvole!");
        }
    });

    endCallButton.addEventListener("click", () => {
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }
        isCaller = false;
        localVideo.srcObject = null;
        remoteVideo.srcObject = null;
        console.log("📴 Poziv prekinut.");
    });

    socket.on("offer", async offer => {
        if (isCaller) {
            console.warn("📵 Ignorišem offer jer sam već caller.");
            return;
        }

        console.log("📡 Primljena ponuda:", offer);
        if (!confirm("📞 Dolazni poziv! Želiš li da prihvatiš?")) return;

        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = localStream;

            peerConnection = createPeerConnection();
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit("answer", answer);
            console.log("✅ Poslat odgovor:", answer);
        } catch (error) {
            console.error("⚠️ Greška pri prihvatanju poziva:", error);
        }
    });

    socket.on("answer", async answer => {
        if (!isCaller) {
            console.warn("📵 Ignorišem answer jer nisam caller.");
            return;
        }

        if (peerConnection && peerConnection.signalingState === "have-local-offer") {
            try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                console.log("✅ Primljen odgovor.");
            } catch (error) {
                console.error("⚠️ Greška pri setRemoteDescription:", error);
            }
        } else {
            console.warn("⛔ Neispravno stanje za postavljanje odgovora:", peerConnection?.signalingState);
        }
    });

    socket.on("ice-candidate", async candidate => {
        if (peerConnection) {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                console.log("✅ ICE kandidat dodat.");
            } catch (error) {
                console.error("⚠️ Greška pri dodavanju ICE kandidata:", error);
            }
        }
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

    function createPeerConnection() {
        const pc = new RTCPeerConnection(servers);
        remoteStream = new MediaStream();
        remoteVideo.srcObject = remoteStream;

        pc.ontrack = event => {
            event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
        };

        pc.onicecandidate = event => {
            if (event.candidate) {
                console.log("📡 Slanje ICE kandidata:", event.candidate);
                socket.emit("ice-candidate", event.candidate);
            }
        };

        return pc;
    }

    // Provera dozvola
    navigator.permissions.query({ name: "camera" }).then(permission => {
        console.log("📷 Status dozvole kamere:", permission.state);
    }).catch(error => console.error("⚠️ Greška pri proveri dozvola za kameru:", error));

    navigator.permissions.query({ name: "microphone" }).then(permission => {
        console.log("🎤 Status dozvole mikrofona:", permission.state);
    }).catch(error => console.error("⚠️ Greška pri proveri dozvola za mikrofon:", error));
});


