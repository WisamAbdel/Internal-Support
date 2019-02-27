/* --Message Format--
 {
	ID : {
			"mame" : "value",
			"message" : "value,
			"time" : "value
		 }
 }

*/


//html strip from a message
function stripHTML(msg) {
	var tmpDiv = document.createElement("div");
	tmpDiv.innerHTML = msg;
	return tmpDiv.textContent || tmpDiv.innerText || "";
}

function receiveMessage(data){

	//collect
	var MESSAGE = data['message'];
	const EMPLOYEE = data['from'];
	var INTERACTION_ID = data['interaction_id'];
	var TIME_STAMP = ''
	if( ! data['time'] ){
		TIME_STAMP = today.getHours() + ':' + today.getMinutes();

	} else {
		TIME_STAMP = data['time'];
	}
	//MESSAGE = stripHTML(MESSAGE)

	//update
	INTERACTION_ID = '#' + INTERACTION_ID + ' tbody';
	const CHAT_CONTAINER  = $( INTERACTION_ID );
	const HTML_MESSAGE = $("<tr id = 'MessageBubble'><td><p id='nameTag'><button type='button' class='btn btn-link disabled'><font color='black'>"+EMPLOYEE+"</font></button></p><i><div class='timeStamp'><span class='badge badge-light'>"+TIME_STAMP+"</span></div></i><hr /><p>"+MESSAGE+"</p></td></tr>");
	CHAT_CONTAINER.append( $(HTML_MESSAGE) );
	const MESSAGE_CONTAINER =  '#' + data['interaction_id'];
	$( MESSAGE_CONTAINER ).animate({
               scrollTop: $( MESSAGE_CONTAINER )[0].scrollHeight}, "slow");
}

function queueMeVisuals(){

	const queue = $( '#queueToggle' );
	if( queue.attr( 'class' ) == 'btn btn-danger'){
			queue.attr( 'class' , 'btn btn-success' );
	} else {
		queue.attr( 'class' , 'btn btn-danger');
	}
}

//Userlist functionality.

function Userclick(event) {
	//hide data-activechat
	const activeChat = $('div').find('*[data-activechat="true"]');
	const  int_id = $(event.target).data('userid');
	activeChat.hide();
	activeChat.attr('data-activechat', 'false');
	//hide notes
	$( '.tool-container' ).hide();
	//Show Chat
	const interaction_id = '#' + int_id;
	$( interaction_id ).show("slide", { direction: "left" }, 150);
	$( interaction_id).attr('data-activechat', 'true');

	//Show notes
	$( '.tool-container[data-interaction="'+int_id+'"' ).show("slide", { direction: "left" }, 150);

	if( $( interaction_id ).attr('data-disabled') == 'true' ){
		 $( '#EntryBox' ).prop('disabled', true);
	} else {
		 $( '#EntryBox' ).prop('disabled', false);
	}
}
//Listeners
$( '#EntryBox' ).keyup( function(event) {
	//enter button
	if (event.keyCode == 13 ) {
	if ( $( '#EntryBox' ).val() == '\n' ) {
		$( '#EntryBox' ).val('');
		return;
}
	const textArea = $( '#EntryBox' );
	//grab message
	const message =  stripHTML(textArea.val());
	textArea.val('');

	//grab current chat interaction if one exists.
	const activeChat = $('div').find('*[data-activechat="true"]');
	if ( activeChat.attr('id') != null ) {
		sendMessage( activeChat.attr('id'), activeChat.attr('data-username'), message);
		receiveMessage({'message': message, 'from' : agent_real_name, 'interaction_id' : activeChat.attr('id') }); //update current chat with message
		alertUser(activeChat.attr('id'), false);
}
	}
});
$( '.user' ).on("click", this.Userclick );
//$( '.user' ).hover(
//	this.UserListIN
//	, this.UserListOUT
//);

function UserListIN(){
	$( this ).append( $('<i class="fa fa-bars" aria-hidden="true"></i>'));
}
function UserListOUT(){
	$( this ).find( "i:last" ).remove();
}
$( '#lookupTranscript' ).on( 'click' , function () {
	const btn = $( '#lookupTranscript' );
	const interaction_id = $( '#transcriptsIDinput' ).val();
	btn.html( 'Lookup' );
	var transcripts_window = window.open( '/transcripts/' + interaction_id, '_blank'  );
	if ( transcripts_window ) {
		transcripts_window.focus();
	} else {
		btn.html( 'Please enable popups!' );
	}

});

$( '#transferChat' ).on('click', function(){

	//grab agents username
	var selected_agent = $( '#transfer-agents :selected' ).val();
	var interaction_id = $('div').find('*[data-activechat="true"]').attr('id');
	if(! selected_agent) {return; }
	if(! interaction_id){
		$( '.oopsTransfer' ).show();
		$( '#oopsTransferText ' ).html('');
		$( '#oopsTransferText ' ).html('<strong>Oh Snappy!</strong> - Please select an active chat.' );
		return;
}
	var data = {
		"sid" : socket.id,
		"to" : selected_agent,
		"interaction_id" :  $('div').find('*[data-activechat="true"]').attr('id')
	};

	//Ask FLASK to process chat transfer.
	$( '.oopsTransfer' ).show();
	$( '#oopsTransferText ' ).html('');
	$( '#oopsTransferText ' ).html('	<center><i class="fa fa-circle-o-notch fa-spin"></i><span class="sr-only">Loading...</span> Transferring..</center>' );
	$( '#transferChat' ).prop("disabled", true);
	$.post('/transfers/interaction', data, function(res){

		$( '.oopsTransfer' ).show();
		$( '#oopsTransferText ' ).html('');
		$( '#oopsTransferText ' ).html('#<b>'+data["interaction_id"]+'</b> has been successfully transferred.');
		$( '#transferChat' ).prop("disabled", false);

		//clear out box
		$('#'+interaction_id+'').remove();
		$('.user[data-userid="'+interaction_id+'"]').remove();
		$('.tool-container[data-interaction="'+interaction_id+'"]').remove();


	}).fail(function(err, status) {
		// responseText, status
 	 $( '.oopsTransfer' ).show();
 	 $( '#oopsTransferText ' ).html('');
 	 $( '#oopsTransferText ' ).html('<strong>Oh Snappy!</strong> - '+err.status+' : ' + err.responseText );
	 $( '#transferChat' ).prop("disabled", false);


	});

});

function passChat(){
	var container = $( '#transferToggle' );

	if (container.is(":hidden")){
	$( '.sub-choice' ).hide("blind", { direction: "up" }, 300);
	container.show("blind", { direction: "down" }, 300);
} else {

	$( '#transferToggle' ).hide("blind", { direction: "up" }, 300);
	return;
}

	$( '.oopsTransfer' ).hide();
	const agents_container = $( '#transfer-agents' );
	agents_container.empty();

	//grabbing agents in queue
	$.get('/transfers/agent_list', function(data){

		//convert to Json for Loop
		var agent_list = JSON.parse(data);


		for( var username in agent_list ){
					if( agent_list[username] == agent_real_name ){
							continue;
					}
					agents_container.append ('<option value="'+username+'">'+agent_list[username]+'</option>');

		}

	}).fail(function(err, status) {
   // responseText, status
	 $( '.oopsTransfer' ).show();
	 $( '#oopsTransferText ' ).html('');
	 $( '#oopsTransferText ' ).html('<strong>Oh Snappy!</strong> - '+err.status+' : ' + err.responseText );

});

}


$( '#ShowTranscriptsBtn' ).on( 'click',  function () {

	//close any tool container opened
	$( '.tool-container' ).hide();

	//show container
	$( '#transcripts-options' ).show("slide", { direction: "left" }, 150);
});
$( '#ShowProfileBtn' ).on('click', function (){
	const profileContainer = $( '#profile-options' );

	//close any tool container opened
	$( '.tool-container' ).hide();

	//grab current username for active chat
	const activeChatUser = $('div').find('*[data-activechat="true"]').attr('data-username');

	//check to see if the iframe exists first.
	if( $('#employeeData[src="http://is.gatorjedi.com:2222/employee/'+activeChatUser+'"]').length ) {
			profileContainer.show("slide", { direction: "left" }, 150);
			console.log('we found one');
			return;
	}else{
		console.log('none was found. creating..');
	//create iframe and append to container for that user
	const employeeData = $( '<iframe width="100%" id="employeeData" height="100%" frameBorder="0" src="http://is.gatorjedi.com:2222/employee/'+activeChatUser+'"> </iframe>' );
	profileContainer.html(employeeData);

	//open up the profile
	profileContainer.show("slide", { direction: "left" }, 150);
 }
});

$( '#ShowSettingsBtn' ).on('click', function(){
	$( '.tool-container' ).hide();
	$( '.tool-container[id="chat-options"]' ).show("slide", { direction: "left" }, 150);

});

$( '#ShowNotesBtn' ).on('click' , function(){

	$( '.tool-container' ).hide();
	const activeChatId = $('div').find('*[data-activechat="true"]').attr('id');

	$( '.tool-container[data-interaction="'+activeChatId+'"' ).show("slide", { direction: "left" }, 150);


});
$( '#endChat' ).on('click', function(){
	//grab activechat interaction_id + textrea container for res
	var activeChat = $('div').find('*[data-activechat="true"]');
	const employee = $('div').find('*[data-activechat="true"]').attr('data-username');
	const interactionResolution = $('#interactionResolution');
	var employeeInList = $('div').find('*[data-userid="'+activeChat.attr('id')+'"]');
	var noteContainer = $('div').find('*[data-interaction="'+activeChat.attr('id')+'"]')


	//collect and empty the textarea
	const resolution = interactionResolution.val();
	interactionResolution.val('');

	//close closeChat section
	$( '#closeToggle' ).hide("blind", { direction: "up" }, 300);

	var data = {
			'interaction_id' : activeChat.attr('id'),
			'employee' : employee,
			'interaction_resolution' : resolution
	};

	closeChat(data);

	//delete chat container
	activeChat.remove();

	//delete from userList
  employeeInList.remove();

	//delete note container
	noteContainer.remove();



});
function alertUser(interaction_id, alrt){
	const userInList = $('.user[data-userid="'+interaction_id+'"]' );
	if( alrt == true){
	userInList.css('color', 'red');
	document.title = '*New Message*';
} else {
	userInList.css('color', 'black');
}

}
function closeToggle() {
	var container = $( '#closeToggle' );

	if (container.is(":hidden")){
		$( '#transferToggle' ).hide();
	container.show("blind", { direction: "down" }, 300);
} else {
	$( '#closeToggle' ).hide("blind", { direction: "up" }, 300);
}
}
function createCase( username, real_name, interaction_id, notes ){
	//creating containers for chats, notes, employee profile, and creating user in userlist
	const tools = $( '.tools-container' );
	const chats = $( '.chats-container' );

	const userList = $( '#UseraddList' );
	const User = $ ("<tr style='cursor: pointer;'><td class='user' data-userid='"+interaction_id+"'>" + real_name + " </td> </tr>");
	const chatBox = $("<div style='' class='chat-container' id='"+interaction_id+"'data-username='"+username+"' data-activechat='false'><table class='table table-striped'><tbody><div class='message-container'> </div></tbody></table></div>").hide();
	var verified = '';

	if( notes['verified'] == 'None'){
		verified = '<tr class="table-danger"><td> <center><i class="fa fa-id-card-o" aria-hidden="true"></i><b id="verified"> NOT VERIFIED</b></center> </td>    </tr> ';
	} else { verified = '<tr class="table-success"><td> <center><i class="fa fa-id-card-o" aria-hidden="true"></i><b id="verified">'+notes['verified']+'</b></center> </td>    </tr> ';}

	const noteBox = $('<!-- Tools start here -->'+''+'<div class = "tool-container" data-interaction="'+notes['interaction_id']+'"><table class="table table-sm">  <tbody>    '+verified+'  </tbody></table><div class="card mb-3">  <h5 class="card-header"><center>Interaction: <b id="interaction_id">'+notes['interaction_id']+'</b></center></h5>  <div class="card-body">    <h5 class="card-title" style="float: left;"><button type="button" class="btn btn-link disabled"><font color="black">Case Type</font></button></h5>    <h5 class="card-subtitle text-muted" style="float: right;"> <button type="button" class="btn btn-link disabled"><font color="black"> <span id="case_type">'+notes['case_type']+'</span> </font></button></h5>  </div>    <table class="table table-sm table-striped">      <tbody>        <tr>          <td><small><button type="button" class="btn btn-link disabled"><font color="black"><center>Chat ID</center></font></button></small></td>                  </tr> <tr><td id="chat_id">'+notes['chat_id']+'</td></tr>        <tr>          <td><small><button type="button" class="btn btn-link disabled"><font color="black">Billing URL</font></button></small></td>                  </tr> <tr><td id="billing_url">'+notes['billing_url']+'</td></tr>        <tr>          <td><small><button type="button" class="btn btn-link disabled"><font color="black">Ticket(s)</font></button> </small></td>         <tr><td id="ticket_id">'+notes['tickets']+'</td></tr>        </tr>        <tr>          <td><small><button type="button" class="btn btn-link disabled"><font color="black">Affected URL</font></button></small></td>       <tr><td id="affected_url">'+notes['affected_url']+'</td></tr>        </tr>        <tr>          <td><small><button type="button" class="btn btn-link disabled"><font color="black">Server</font></button></small></td>          <tr><td id="server">'+notes['server']+'</td></tr>        </tr>        <tr>          <td><small><button type="button" class="btn btn-link disabled"><font color="black">Replication</font></button></small></td>        </tr> <tr><td id="replication">'+notes['replication']+'</td></tr>        <tr>          <td><small><button type="button" class="btn btn-link disabled"><font color="black">Troubleshoot</font></button></small></td>          <tr><td id="troubleshoot">'+notes['troubleshooting']+'</td></tr>        </tr>        <tr>          <td><small><button type="button" class="btn btn-link disabled"><font color="black">Issue/Error</font></button></small></td>        </tr> <tr><td id="issue">'+notes['issue']+'</td></tr>      </tbody>    </table></div></div> <!-- Tools end here-->').hide();

	//giving the user in userlist functionality
	User.on("click" , this.Userclick);
	//User.hover( this.UserListIN, this.UserListOUT);

	//place containers to location + welcome message.
	$(User).appendTo(userList);
	$( chatBox ).appendTo(chats);
	$( noteBox ).appendTo(tools);
	alertUser(interaction_id, true);
	systemMessage('<br/><div class="text-dark"> <font size="2px"> New Interaction <b>' + interaction_id + '</b> has been created and assigned to <b>'+agent_name+'</b>. Please allow a few moments for the agent to address your case. </font></div><hr/>', interaction_id);
}

function systemMessage(message, interaction_id){
	const sys_message = '<i><div class="text-dark">' + message + '</div></i>';
	interaction_id = '#' + interaction_id + ' tbody';
	$( interaction_id ).append('<center>' + sys_message + '</center>');

}
function closeInt(data){
		systemMessage('This interaction has been closed by <b>'+ data['real_name'] + '</b>.', data['interaction_id']);

		//disable container to prevent messages
	 	interaction_id = '#' + data['interaction_id'];
		$( interaction_id ).attr('data-disabled', 'true');

		//check if current container is the interaction and disable
		const activeChat = $('div').find('*[data-activechat="true"]');
		if( activeChat.attr('data-disabled') == 'true' ){
			 $( '#EntryBox' ).prop('disabled', true);
		}

}

$(document).ready(function () {

})

document.addEventListener("visibilitychange", function() {
  if(document.visibilityState){
		document.title = 'Internal Support';
	}
});

function chatTransfer(data){
		var old_agent = data['old_agent'];
		var interaction_id = data['interaction_id'];
		var employee_real_name = data['employee_real_name'];
		var employee_username = data['employee_username'];

		var notes = data['notes'];
		var transcript = data['transcript'];


		const tools = $( '.tools-container' );
		const chats = $( '.chats-container' );

		const userList = $( '#UseraddList' );
		const User = $ ("<tr style='cursor: pointer;'><td class='user' data-userid='"+interaction_id+"'>" + employee_real_name + " </td> </tr>");
		const chatBox = $("<div style='' class='chat-container' id='"+interaction_id+"'data-username='"+employee_username+"' data-activechat='false'><table class='table table-striped'><tbody><div class='message-container'> </div></tbody></table></div>").hide();

		if( notes['verified'] == 'None'){
			verified = '<tr class="table-danger"><td> <center><i class="fa fa-id-card-o" aria-hidden="true"></i><b id="verified"> NOT VERIFIED</b></center> </td>    </tr> ';
		} else { verified = '<tr class="table-success"><td> <center><i class="fa fa-id-card-o" aria-hidden="true"></i><b id="verified">'+notes['verified']+'</b></center> </td>    </tr> ';}


		const noteBox = $('<!-- Tools start here -->'+''+'<div class = "tool-container" data-interaction="'+notes['interaction_id']+'"><table class="table table-sm">  <tbody>    '+verified+'  </tbody></table><div class="card mb-3">  <h5 class="card-header"><center>Interaction: <b id="interaction_id">'+notes['interaction_id']+'</b></center></h5>  <div class="card-body">    <h5 class="card-title" style="float: left;"><button type="button" class="btn btn-link disabled"><font color="black">Case Type</font></button></h5>    <h5 class="card-subtitle text-muted" style="float: right;"> <button type="button" class="btn btn-link disabled"><font color="black"> <span id="case_type">'+notes['case_type']+'</span> </font></button></h5>  </div>    <table class="table table-sm table-striped">      <tbody>        <tr>          <td><small><button type="button" class="btn btn-link disabled"><font color="black"><center>Chat ID</center></font></button></small></td>                  </tr> <tr><td id="chat_id">'+notes['chat_id']+'</td></tr>        <tr>          <td><small><button type="button" class="btn btn-link disabled"><font color="black">Billing URL</font></button></small></td>                  </tr> <tr><td id="billing_url">'+notes['billing_url']+'</td></tr>        <tr>          <td><small><button type="button" class="btn btn-link disabled"><font color="black">Ticket(s)</font></button> </small></td>         <tr><td id="ticket_id">'+notes['tickets']+'</td></tr>        </tr>        <tr>          <td><small><button type="button" class="btn btn-link disabled"><font color="black">Affected URL</font></button></small></td>       <tr><td id="affected_url">'+notes['affected_url']+'</td></tr>        </tr>        <tr>          <td><small><button type="button" class="btn btn-link disabled"><font color="black">Server</font></button></small></td>          <tr><td id="server">'+notes['server']+'</td></tr>        </tr>        <tr>          <td><small><button type="button" class="btn btn-link disabled"><font color="black">Replication</font></button></small></td>        </tr> <tr><td id="replication">'+notes['replication']+'</td></tr>        <tr>          <td><small><button type="button" class="btn btn-link disabled"><font color="black">Troubleshoot</font></button></small></td>          <tr><td id="troubleshoot">'+notes['troubleshooting']+'</td></tr>        </tr>        <tr>          <td><small><button type="button" class="btn btn-link disabled"><font color="black">Issue/Error</font></button></small></td>        </tr> <tr><td id="issue">'+notes['issue']+'</td></tr>      </tbody>    </table></div></div> <!-- Tools end here-->').hide();

		//giving the user in userlist functionality
		User.on("click" , this.Userclick);
		//User.hover( this.UserListIN, this.UserListOUT);
		transcript = JSON.parse(transcript);

		//place containers to location
		$( chatBox ).appendTo(chats);
		$( noteBox ).appendTo(tools);

		const CHAT_CONTAINER = document.querySelector('#\\' + interaction_id + ' tbody');
		//reload messages into chat

		for ( var i = 1; i <= Object.keys(transcript).length - 2; i++ ){

				const msgBbl = "<tr id = 'MessageBubble'><td><p id='nameTag'><button type='button' class='btn btn-link disabled'><font color='black'>"+transcript[i]['name']+"</font></button></p><i><div class='timeStamp'><span class='badge badge-light'>"+transcript[i]['time']+"</span></div></i><hr /><p>"+transcript[i]['message']+"</p></td></tr>";
				CHAT_CONTAINER.appendChild(msgBbl);

		}


		$(User).appendTo(userList);
		alertUser(interaction_id, true);

}
