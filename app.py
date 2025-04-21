<<<<<<< HEAD
from flask import Flask, render_template
from flask_socketio import SocketIO, send
from flask_cors import CORS
from waitress import serve

app = Flask(__name__)
CORS(app)  # Omogućava CORS za sve rute

app.config['SECRET_KEY'] = 'your_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

@app.route("/")
def home():
    return render_template("index.html")

@socketio.on("message")
def handle_message(msg):
    print(f"📩 Poruka primljena: {msg}")
    send(msg, broadcast=True)

@socketio.on("offer")
def handle_offer(data):
    print("📡 Primljena ponuda:", data)
    socketio.emit("offer", data)  # Uklonjen broadcast=True

@socketio.on("answer")
def handle_answer(data):
    print("✅ Primljen odgovor:", data)
    socketio.emit("answer", data)  # Uklonjen broadcast=True

@socketio.on("ice-candidate")
def handle_ice_candidate(data):
    print("❄️ Primljen ICE kandidat:", data)
    socketio.emit("ice-candidate", data)  # Uklonjen broadcast=True

if __name__ == "__main__":
    # Pokrećemo aplikaciju koristeći waitress
    serve(app, host='0.0.0.0', port=5000)
=======
from flask import Flask, render_template, request
from flask_socketio import SocketIO, send, emit, join_room
from flask_cors import CORS
from flask_socketio import join_room


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

@socketio.on('join')
def handle_join(data):
    room = data['room']
    join_room(room)
    print(f"👥 Korisnik se pridružio sobi: {room}")
    emit('user-joined', {'msg': 'Novi korisnik je u sobi'}, room=room)

@socketio.on('offer')
def handle_offer(data):
    room = data['room']
    print("📡 Ponuda:", data)
    emit('offer', data, room=room)

@socketio.on('answer')
def handle_answer(data):
    room = data['room']
    print("✅ Odgovor:", data)
    emit('answer', data, room=room)

@socketio.on('ice-candidate')
def handle_ice_candidate(data):
    room = data['room']
    print("❄️ ICE kandidat:", data)
    emit('ice-candidate', data, room=room)

@socketio.on('message')
def handle_message(msg):
    print(f"📩 Poruka: {msg}")
    send(msg, broadcast=True)

@socketio.on('join')
def handle_join(room):
    print(f"🔗 Korisnik se pridružio sobi: {room}")
    join_room(room)
    emit("ready", room=room)

# Start
if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)

>>>>>>> ad1fa1c002d6beb4551432457e6998626e9d0e2f


