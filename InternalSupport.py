from flask import Flask
from flask_socketio import SocketIO


app = Flask(__name__)
socketio = SocketIO(app)


def create_app(app):

    app.config.from_pyfile('config.py')

    return app

from views import *

if __name__ == '__main__':

    app = create_app(app)
    socketio.run(app, port=2222, host="is.gatorjedi.com",debug=True)
