from flask_sqlalchemy import SQLAlchemy
from InternalSupport import app
from flask_login import LoginManager, UserMixin, login_user, login_required, current_user, logout_user

#SQLAlchemy settings
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://REDACTED@localhost/REDACTED'
app.config['SQLALCHEMY_POOL_SIZE'] = 300
app.config['SQLALCHEMY_POOL_RECYCLE'] = 280
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)


class Users(UserMixin, db.Model):
    ''' Primary MySQL database, used to manage users'''
    id = db.Column(db.Integer, primary_key=True)

    username = db.Column(db.String(30), unique=True)
    password = db.Column(db.String(255), unique=False)
    position = db.Column(db.String(30), unique=False)
    chat_limit = db.Column(db.Integer, unique=False)
    sid = db.Column(db.String(255), unique=False)
    in_queue = db.Column(db.String(30), unique=False)
    real_name = db.Column(db.String(30), unique=False)
    user_assoc = db.Column(db.String(255), unique=False)
    user_notes = db.Column(db.Text, unique=False)

class Transcripts(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    transcript = db.Column(db.Text, primary_key=False)
    case_resolution = db.Column(db.Text, primary_key=False)
    agent = db.Column(db.Text, primary_key=False)
    employee = db.Column(db.Text, primary_key=False)
    date = db.Column(db.DateTime, primary_key=False)
class notes_support(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	affected_url = db.Column(db.Text, unique=False)
	billing_url = db.Column(db.Text, unique=False)
	case_type = db.Column(db.Text, unique=False)
	chat_id = db.Column(db.Text, unique=False)
	issue = db.Column(db.Text, unique=False)
	replication = db.Column(db.Text, unique=False)
	troubleshooting = db.Column(db.Text, unique=False)
	server = db.Column(db.Text, unique=False)
	tickets = db.Column(db.Text, unique=False)
	verified = db.Column(db.Text, unique=False)


@login_manager.user_loader
def load_user(user_id):
    return Users.query.get(int(user_id))
