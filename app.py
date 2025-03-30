from flask import Flask, render_template
from flask_socketio import SocketIO, send
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Omogućava CORS za sve rute

app.config['SECRET_KEY'] = 'your_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

@app.route("/")
def home():
    return render_template("index.html")  # Proveri da li treba "index.html"

@app.route("/chat")
def chat():
    return render_template("chat.html")

@app.route("/video")
def video():
    return render_template("video.html")

@socketio.on("message")
def handle_message(msg):
    print(f"📩 Poruka primljena: {msg}")
    send(msg, broadcast=True)

@socketio.on("offer")
def handle_offer(data):
    print("📡 Primljena ponuda:", data)
    socketio.emit("offer", data, broadcast=True)

@socketio.on("answer")
def handle_answer(data):
    print("✅ Primljen odgovor:", data)
    socketio.emit("answer", data, broadcast=True)

@socketio.on("ice-candidate")
def handle_ice_candidate(data):
    print("❄️ Primljen ICE kandidat:", data)
    socketio.emit("ice-candidate", data, broadcast=True)
if __name__ == "__main__":
         app.run(debug=True, host="0.0.0.0", port=5000)




