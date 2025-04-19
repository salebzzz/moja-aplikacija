const video = document.getElementById('videoElement');
const subtitles = document.getElementById('subtitles');

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function (stream) {
            video.srcObject = stream;
        })
        .catch(function (error) {
            console.error("Greška pri pokretanju kamere:", error);
        });
} else {
    console.error("MediaDevices API nije podržan u ovom pretraživaču.");
}

// Ovdje možeš dodati dodatnu logiku za prikaz titlova kasnije


