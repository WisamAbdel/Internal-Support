from db import *
from werkzeug.security import generate_password_hash, check_password_hash

def hashed(password):
    return generate_password_hash(password)

def authenticate_password(client_password, database_password):
    return check_password_hash(database_password, client_password)

def employee_only():
    if current_user.position == 'agent': return
def agent_only():
    if current_user.position == 'employee': return
