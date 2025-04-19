from flask import Flask, render_template
from flask_socketio import SocketIO, send
from flask_cors import CORS

# Inicijalizacija aplikacije
app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['SECRET_KEY'] = 'your_secret_key'

# SocketIO i CORS
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")
CORS(app)

# Rute
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat')
def chat():
    return render_template('chat.html')

@app.route('/video')
def video():
    return render_template('video.html')

# SocketIO događaji
@socketio.on('message')
def handle_message(msg):
    print(f"📩 Poruka primljena: {msg}")
    send(msg, broadcast=True)

@socketio.on('offer')
def handle_offer(data):
    print("📡 Primljena ponuda:", data)
    socketio.emit("offer", data)

@socketio.on('answer')
def handle_answer(data):
    print("✅ Primljen odgovor:", data)
    socketio.emit("answer", data)

@socketio.on('ice-candidate')
def handle_ice_candidate(data):
    print("❄️ Primljen ICE kandidat:", data)
    socketio.emit("ice-candidate", data)

# Start
if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)


