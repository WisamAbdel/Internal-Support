from InternalSupport import app
from flask import render_template, request, redirect, url_for, session
from werkzeug.security import generate_password_hash, check_password_hash
import os
import json
import auth
from db import *
from chat import *

@login_manager.unauthorized_handler
def unauthorized():
    return redirect('/login?snappy=1')

@app.route('/agent', methods=['GET','POST'])
@login_required
def agent():
    user = current_user
    if user.position =='employee':
        return render_template('oops.htm', error='Access restricted.')

    employees = dict()
    chats = dict()
    notes = dict()


    #pulling the user list for the agent
    raw_list = json.loads(user.user_assoc)
    for interaction_id in raw_list:
        employees[int(interaction_id)] = { 'username' : raw_list[interaction_id], 'real_name' : '{0}'.format(Users.query.filter_by(username=raw_list[interaction_id]).first().real_name) }

    #pulling existing transcript for agent's chats + pulling notes from tanscripts for agent's cases
    interaction_id_list = employees.keys()
    for interaction_id in interaction_id_list:
        chat_transcript = json.loads(Transcripts.query.filter_by(id=interaction_id).first().transcript)
        note = {
			'affected_url'    : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().affected_url),
			'billing_url'     : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().billing_url),
			'case_type'       : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().case_type),
			'chat_id'         : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().chat_id),
			'issue'           : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().issue),
			'replication' 	  : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().replication),
			'troubleshooting' : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().troubleshooting),
			'server'          : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().server),
			'verified'        : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().verified),
			'tickets'         : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().tickets),
            'interaction_id'  : '{}'.format(interaction_id)
		}
        chats[int(interaction_id)] = chat_transcript
        notes[int(interaction_id)] = note

    return render_template('agent.htm', employees=employees, chats=chats, notes=notes)

#@app.errorhandler(500)
#def internal_error(e):
#	return render_template('oops.htm', error='{0}'.format(e))
@app.errorhandler(404)
def page_not_found(e):
	return render_template('oops.htm', error='{0}'.format(e))

@app.route('/case', methods=['GET', 'POST'])
@login_required
def case():
    user = current_user
    if user.position =='agent':
        return render_template('oops.htm', error='This page is restricted for your role!')
    chats = 0
    raw_list = json.loads(user.user_assoc)
    for interaction_id in raw_list:
        chats += 1

    error = None
    notes = {}
    notes['chat_id']='N/A'
    notes['billing_url']='N/A'
    notes['verified']='None'
    notes['case_type']='Other'
    notes['tickets']=''
    notes['affected_url']='N/A'
    notes['server']='N/A'
    notes['replication']=''
    notes['issue']=''
    if request.method == 'POST':
        notes['chat_id'] = request.form['chat_id']
        notes['billing_url'] = request.form['billing_url']
        notes['verified'] = request.form['verified']
        notes['case_type'] = request.form['case_type']
        notes['tickets'] = request.form['tickets']
        notes['affected_url'] = request.form['affected_url']
        notes['server'] = request.form['server']
        notes['replication'] = request.form['replication']
        notes['troubleshooting'] = request.form['troubleshooting']
        notes['issue'] = request.form['issue']
        agent, interaction_id = create_chat_session(current_user, notes)
        if agent is False:
            return render_template('oops.htm', error='We were unable to assign your case to an active agent at this time.')
        #current_user.in_chats_with[interaction_id] = agent
        #current_user.notes_by_interaction[interaction_id] = notes
        CreateCase(agent, user, interaction_id, notes)
        notes['agent'] = agent
        notes['employee'] = current_user.username

        notes_json = json.dumps(notes)

        tmp_json = open("tmp/{}".format(interaction_id),"w+")
        tmp_json.write(notes_json)
        tmp_json.close()

        os.system("./system/transcriptctl.pl --input --context='start' --json=\"$(cat ./tmp/{})\"".format(interaction_id))
        return redirect('/chat')


    return render_template('case.htm', chats=chats)

@app.route('/chat')
@login_required
def chat():
    user = current_user
    if user.position == 'agent':
        return render_template('oops.htm', error='This page is restricted for your role!')

    agents = dict()
    chats = dict()
    notes = dict()

    #pulling the user list for the agent
    raw_list = json.loads(user.user_assoc)
    for interaction_id in raw_list:
        agents[int(interaction_id)] = { 'username' : raw_list[interaction_id], 'real_name' : '{0}'.format(Users.query.filter_by(username=raw_list[interaction_id]).first().real_name) }

    #pulling existing transcript for agent's chats + pulling notes from tanscripts for agent's cases
    interaction_id_list = agents.keys()
    for interaction_id in interaction_id_list:
        chat_transcript = json.loads(Transcripts.query.filter_by(id=interaction_id).first().transcript)
        note = {
    		'affected_url'    : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().affected_url),
    		'billing_url'     : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().billing_url),
    		'case_type'       : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().case_type),
    		'chat_id'         : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().chat_id),
    		'issue'           : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().issue),
    		'replication' 	  : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().replication),
    		'troubleshooting' : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().troubleshooting),
    		'server'          : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().server),
    		'verified'        : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().verified),
    		'tickets'         : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().tickets),
            'interaction_id'  : '{}'.format(interaction_id)
    	}
        chats[int(interaction_id)] = chat_transcript
        notes[int(interaction_id)] = note


    return render_template('employee.htm', agents=agents, chats=chats, notes=notes)

@app.route('/employee/<employee_username>')
@login_required
def load_employee(employee_username):
    if current_user.position == 'employee':
        return render_template('oops.htm', error='This page is restricted for your role!')
    try:
        employee = Users.query.filter_by(username=employee_username).first()
        profile = os.popen('./system/empdata --profile --user={}'.format(employee.username)).read()

        return render_template('employeeProfile.htm', employee_username=employee.username, employee_name=employee.real_name,employee_notes=json.loads(employee.user_notes), profile=json.loads(profile))
    except:
        return ''

@app.route( '/employee/notate', methods=['POST'] )
@login_required
def notateEmployee():
	if request.method == 'POST':

		content = request.form["content"]
		content_type = request.form["type"]
		sid = request.form["sid"]
		employee = request.form["employee"]

		try:
			agent = Users.query.filter_by(sid=sid).first().real_name
			os.system( "./system/empdata --add --user={user} --json='{note}'".format( user=employee , note=json.dumps({ content_type : content, 'agent' : agent })))
		except:
			return 'Bad Request', 405
		return 'OK', 200
	return 'Unauthorized' ,401

@app.route('/transfers/<option>', methods=['GET', 'POST'])
@login_required
def agent_transfers(option):
    if current_user.position == 'employee':
        return 'Unauthorized', 401

    if option == 'agent_list' and request.method == 'GET' :
        #grab agents in queue
        try:
            agents_in_queue = subprocess.check_output("./system/queuectl --list".split(' '), stderr=subprocess.STDOUT)
            agents_in_queue = str(agents_in_queue)[2:-2]

        except subprocess.CalledProcessError as exc:
            return exc.output, 500

        #no perl errors
        if '!!' in agents_in_queue:
            return agents_in_queue, 503

        agents = agents_in_queue.split(',')
        agent_list = dict()
        for agent in agents:
            agent_list[agent] = Users.query.filter_by(username=agent).first().real_name

        agent_list = json.dumps(agent_list)
        return agent_list, 200

    elif option == 'interaction' and request.method == 'POST':
        #transfer interaction to agent
        interaction_id = request.form["interaction_id"]
        to = request.form["to"]
        sid = request.form["sid"]
        interaction = Transcripts.query.filter_by(id=interaction_id).first()

        #check to see if users exist
        try:
            old_agent = Users.query.filter_by(sid=sid).first()
            new_agent = Users.query.filter_by(username=to).first()
            employee = Users.query.filter_by(username=interaction.employee).first()
        except:
            return 'Invalid User(s).', 405

        #check to see if agent still in queue
        try:
            agents_in_queue = subprocess.check_output("./system/queuectl --list".split(' '), stderr=subprocess.STDOUT)
            if new_agent.username not in str(agents_in_queue):
                return '{} not found active in queue.'.format(new_agent.real_name) , 405

        except subprocess.CalledProcessError as exc:
            return exc.output, 500


        #remove agent from employee's userlist and vice versa, then append to new employee/agent's userlist
        os.system('./system/ulctl --remove --user {agent} --item {employee} --id {interaction_id}'.format(agent=old_agent.username, employee=employee.username, interaction_id=interaction_id))
        os.system('./system/ulctl --remove --user {employee} --item {agent} --id {interaction_id}'.format(employee=employee.username, agent=old_agent.username, interaction_id=interaction_id))

        os.system('./system/ulctl --add --user {agent} --item {employee} --id {interaction_id}'.format(agent=new_agent.username, employee=employee.username, interaction_id=interaction_id))
        os.system('./system/ulctl --add --user {employee} --item {agent} --id {interaction_id}'.format(employee=employee.username, agent=new_agent.username, interaction_id=interaction_id))

        SysMsg = {
            "interaction_id" : "{}".format(interaction_id),
            "message" : {
                        "name" : "System",
                        "time" : "",
                        "message" : "{old_agent} has transferred interaction #{interaction} to {new_agent}<br/>".format(
                            old_agent=old_agent.real_name, interaction=interaction_id,new_agent=new_agent.real_name
                        )
            }
        }
        SysMsg = json.dumps(SysMsg)
        os.system("./system/transcriptctl.pl --input --context='update' --json='{message}'".format(message=SysMsg))

        #grab interaction chat history + notes
        note = {
			'affected_url'    : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().affected_url),
			'billing_url'     : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().billing_url),
			'case_type'       : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().case_type),
			'chat_id'         : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().chat_id),
			'issue'           : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().issue),
			'replication' 	  : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().replication),
			'troubleshooting' : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().troubleshooting),
			'server'          : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().server),
			'verified'        : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().verified),
			'tickets'         : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().tickets),
            'interaction_id'  : '{}'.format(interaction_id)
		}

        transcript = Transcripts.query.filter_by(id=interaction_id).first().transcript

        #send to new_agent
        socketio.emit('chatTransfer', {

        'old_agent'           : old_agent.real_name,
    	'interaction_id'      : interaction_id,
    	'employee_real_name'  : employee.real_name,
        'employee_username'   : employee.username,
        'notes'               : note,
        'transcript'          : transcript

    	},
    	room=new_agent.sid)

        return '', 200

    return 'Request Not Allowed', 405



@app.route('/transcripts/<int:interaction_id>')
@login_required
def load_transcript(interaction_id):
	if current_user.position == 'employee':
		return render_template('oops.htm', error='This page is restricted for your role!')

	try:
		chat_interaction_data = json.loads(Transcripts.query.filter_by(id=interaction_id).first().transcript)
		note = {
            'affected_url'    : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().affected_url),
            'billing_url'     : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().billing_url),
            'case_type'       : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().case_type),
            'chat_id'         : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().chat_id),
            'issue'           : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().issue),
            'replication'     : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().replication),
            'troubleshooting' : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().troubleshooting),
            'server'          : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().server),
            'verified'        : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().verified),
            'tickets'         : '{}'.format(notes_support.query.filter_by(id=interaction_id).first().tickets),
            'interaction_id'  : '{}'.format(interaction_id),
			'agent'			  : '{}'.format(Users.query.filter_by(username=(Transcripts.query.filter_by(id=interaction_id).first().agent)).first().real_name),
			'employee'        : '{}'.format(Users.query.filter_by(username=(Transcripts.query.filter_by(id=interaction_id).first().employee)).first().real_name),
			'date'            : '{}'.format(Transcripts.query.filter_by(id=interaction_id).first().date)
        }
		res= Transcripts.query.filter_by(id=interaction_id).first().case_resolution
	except:
		return render_template('oops.htm', error='Invalid Interaction ID'), 405


	return render_template('transcripts.htm', chat=chat_interaction_data, notes=note, interaction_resolution=res)

@app.route('/')
def take2Login():
    return redirect('/login')
@app.route('/login?snappy=<int:status>', methods=['GET', 'POST'])
@app.route('/login', methods=['GET', 'POST'])
def login(status=None):
    error = None
    username = ''
    password = ''
    if current_user.is_authenticated:
        if current_user.position == 'employee':
            return redirect('/case')
        elif current_user.position == 'agent':
            return redirect('/agent')
        elif current_user.position == 'admin':
            return redirect('/admin')

    if(request.method == 'POST'):

        username = request.form['username']
        password = request.form['password']

        registered_user = Users.query.filter_by(username=username).first()

        if(registered_user is None):
            error = 'Invalid username. Please try again.'
            return render_template('/login/index.htm', error=error)
        else:
            password_authentication = auth.authenticate_password(str(password),str(registered_user.password))
            if password_authentication is True:
                login_user(registered_user)
                if registered_user.position == 'agent':
                    return redirect('/agent')
                elif registered_user.position == 'employee':
                    return redirect('/case')
                elif registered_user.position == 'admin':
                    return redirect('/admin')
            else:
                error = 'Invalid password. Please try again.'
    return render_template('/login/index.htm',error=error)


@app.route('/logout')
@login_required
def logout():
    if current_user.position == 'agent':
        os.system('./system/queuectl -d {user}'.format(user=current_user.username))
    logout_user()
    return redirect('/login')



@app.route('/admin/transcripts')
@login_required
def admin_transcripts():
    if current_user.position == 'admin':
        return render_template('/admin/transcripts.html')
    return render_template( 'oops.htm', error='This page is restricted for your role!')

@app.route('/admin')
@login_required
def admin():
	if current_user.position == 'admin':
		return render_template('/admin/index.htm')

	return render_template( 'oops.htm', error='This page is restricted for your role!')
