import pymysql, subprocess
from InternalSupport import socketio
from flask import request
from db import *
import os
import json

class system_database:

    ''' handles system changes and keeps track of interactions and datetime'''

    def __init__(self, host, user, passw, db):

        self.host = host
        self.user = user
        self.passw = passw
        self.db = db
        self.database = None


    def connectToDatabase(self):
        self.database = pymysql.connect(self.host, self.user, self.passw, self.db)
    def closeDatabase(self):
        try:
            self.database.close()
        except:
            pass

    def assignSID(self, user, sid):
        self.connectToDatabase()
        cursor = self.database.cursor()
        try:
            cursor.execute("UPDATE users SET sid = '{sid}' WHERE username='{user}'".format(sid=sid,user=user))
        except pymysql.err.ProgrammingError as err:
            print("Query failed in processing Session ID for chat.\nError: {}"
            .format(err))


        cursor.close()
        self.closeDatabase()
    def giveInteractionId(self):
        #Increment interaction ID by 1 and update database
        self.connectToDatabase()
        cursor = self.database.cursor()
        try:
            cursor.execute('SELECT interaction FROM system')
            interaction = cursor.fetchone()
            interaction = interaction[0] + 1

            cursor.execute('UPDATE system SET interaction = {new_interaction_id}'.format(new_interaction_id=interaction))
            cursor.close()

            return interaction

        except pymysql.err.ProgrammingError as err:
            print("Query failed in getting Interaction ID for chat.\nError: {}"
            .format(err))
        cursor.close()
        self.closeDatabase()


def create_chat_session(USER, notes):
    #Gather interaction ID, notes, and connect to an agent.
    interaction_id = system_db.giveInteractionId()
    notes['interaction_id'] = interaction_id

    #Wilcots, Employee assignment
    try:

        agent = str(subprocess.check_output(["./system/up_next.pl"],
            stderr=subprocess.PIPE))
        agent = agent[agent.find("'")+1:agent.find('\n')-2]
		#update chat count for agent
        subprocess.Popen(("./system/up_next.pl".format(AGENT=agent).split(" ")), stdout=subprocess.PIPE)

    except subprocess.CalledProcessError as error:
        agent = False
        return agent, interaction_id

    return agent, interaction_id

system_db = system_database('localhost', 'is_96Qh2vwY9y2SE', 'QcMh7n0hyYWfV5hXIf', 'is_Y8ZZ4wQYD6Cu7bNZ')

#Socket management
def CreateCase(agent, employee, interaction_id, notes):
	#grab user object for agent
	agent = Users.query.filter_by(username=agent).first()

	#update userlist for both parties.
	os.system('./system/ulctl --add --user {agent} --item {employee} --id {interaction_id}'.format(agent=agent.username, employee=employee.username, interaction_id=interaction_id))
	os.system('./system/ulctl --add --user {employee} --item {agent} --id {interaction_id}'.format(employee=employee.username, agent=agent.username, interaction_id=interaction_id))

	
	socketio.emit('createCase', {
		'interaction_id' : interaction_id,
		'employee' : employee.username,
		'employee_realname' : employee.real_name,
		'notes' : notes,
		'user_notes' : employee.user_notes,
		'user_profile' : ''
	}, room=agent.sid)

@socketio.on('NewSessionID')
def AssignSessionID(SESSION_DATA):
    system_db.assignSID(current_user.username, SESSION_DATA['sid'])

@socketio.on('closeChat')
def closeChatBySID(CLOSE_DATA):
    case_resolution = str(CLOSE_DATA['interaction_resolution']).replace("'","&#39;")
    employee_username = CLOSE_DATA['employee']
    print('THIS IS THE EMPLOYEE NAME: ' + CLOSE_DATA['employee'])
    interaction_id = CLOSE_DATA['interaction_id']

    #sender must be a valid sid
    if Users.query.filter_by(sid=CLOSE_DATA['sid']).first():

        data = {
            'interaction_id' : interaction_id,
            'case_resolution' : case_resolution,
            'chat_time': 'N/A'
            }

        res = json.dumps(data)
        #close case, and add resolution
        os.system("./system/transcriptctl.pl --input --context='end' --json='{res}'".format(res=res))

        #remove usersfrom userlist of both parties
        os.system('./system/ulctl --remove --user {agent} --item {employee} --id {interaction_id}'.format(agent=Users.query.filter_by(sid=CLOSE_DATA['sid']).first().username, employee=employee_username, interaction_id=interaction_id))
        os.system('./system/ulctl --remove --user {employee} --item {agent} --id {interaction_id}'.format(employee=employee_username, agent=Users.query.filter_by(sid=CLOSE_DATA['sid']).first().username, interaction_id=interaction_id))

        #clear out employee's screen through socket emit
        socketio.emit( 'closeInt' , {

                        'real_name' : Users.query.filter_by(sid=CLOSE_DATA['sid']).first().real_name,
                        'interaction_id' : interaction_id
        })


@socketio.on('SendMessage')
def ProcessMessage(MESSAGE_DATA):
	#Log the message to transcripts
	content = str(MESSAGE_DATA['message']).replace("'","&#39;")
	message = { "interaction_id" : "{}".format(MESSAGE_DATA['interaction_id']),
				"message" : {
							"name"    : "{}".format(Users.query.filter_by(sid=MESSAGE_DATA['from']).first().real_name),
							"time"    : "{}".format(MESSAGE_DATA['time_stamp']),
							"message" : "{}".format(content),
} }
	Jmsg = json.dumps(message)
#	Jmsg = str(json.loads(Jmsg))
	os.system("./system/transcriptctl.pl --input --context='update' --json='{message}'".format(message=Jmsg))
	#Send message to sid pulled from MySQL
	socketio.emit('receiveMessage', { 'message' : MESSAGE_DATA['message'],
	'from' : current_user.real_name,
	'interaction_id' : MESSAGE_DATA['interaction_id']
	}, callback=activeSessionCheck,
	room=Users.query.filter_by(username=MESSAGE_DATA['to']).first().sid)

def activeSessionCheck(res):
	pass
@socketio.on_error()
def sockErr(e):
    print('SocketIO has ran into an error: ' + str(e))

@socketio.on('queueMe')
def updateQueue(data):
    user = Users.query.filter_by(sid=data['sid']).first()
    os.system('./system/queuectl --toggle {username}'.format(username=user.username))
