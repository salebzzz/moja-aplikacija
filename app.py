from flask import Flask, render_template, request
from flask_socketio import SocketIO, send, emit, join_room
from flask_cors import CORS
from waitress import serve

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

# Pokretanje aplikacije (na Render koristi se waitress)
if __name__ == '__main__':
    serve(app, host='0.0.0.0', port=5000)


