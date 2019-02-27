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
	//MESSAGE = stripHTML(MESSAGE)

	//update
	INTERACTION_ID = '#' + INTERACTION_ID + ' tbody';
	const CHAT_CONTAINER  = $( INTERACTION_ID );
	const TIME_STAMP = today.getHours() + ':' + today.getMinutes();
	const HTML_MESSAGE = $("<tr id = 'MessageBubble'><td><p id='nameTag'><button type='button' class='btn btn-link disabled'><font color='black'>"+EMPLOYEE+"</font></button></p><i><div class='timeStamp'><span class='badge badge-light'>"+TIME_STAMP+"</span></div></i><hr /><p>"+MESSAGE+"</p></td></tr>");
	CHAT_CONTAINER.append( $(HTML_MESSAGE) );
	const MESSAGE_CONTAINER =  '#' + data['interaction_id'];
	$( MESSAGE_CONTAINER ).animate({
               scrollTop: $( MESSAGE_CONTAINER )[0].scrollHeight}, "slow");
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

function UserListIN(){
	$( this ).append( $('<i class="fa fa-bars" aria-hidden="true"></i>'));
}
function UserListOUT(){
	$( this ).find( "i:last" ).remove();
}
$( '#ShowSettingsBtn' ).on('click', function(){
	$( '.tool-container' ).hide();
	$( '.tool-container[id="chat-options"]' ).show("slide", { direction: "left" }, 150);

});

$( '#confirmEndChat' ).on('click', function(){

  //remove the confirmation
  $( '#confirmationClose' ).hide("slide", { direction: "left" }, 300);
  $( '#endChatBtn' ).show();

  //grab activechat interaction_id + textrea container for res
  var activeChat = $('div').find('*[data-activechat="true"]');
  const agent = $('div').find('*[data-activechat="true"]').attr('data-username');
  const interactionResolution = $('#interactionResolution');
  var agentInList = $('div').find('*[data-userid="'+activeChat.attr('id')+'"]');
  var noteContainer = $('div').find('*[data-interaction="'+activeChat.attr('id')+'"]')

  //collect and empty the textarea
  const resolution = interactionResolution.val();
  interactionResolution.val('');


  var data = {
      'interaction_id' : activeChat.attr('id'),
      'employee' : agent,
      'interaction_resolution' : ''
  };

  closeChat(data);

  //delete container
  activeChat.remove();

  //delete agent from userlist
  agentInList.remove();

  //delete note container
  noteContainer.remove();

});

$( '#endChatBtn' ).on('click', function(){
  $( '#endChatBtn' ).hide();
  $( '#confirmationClose' ).show("slide", { direction: "right" }, 300);
});
function CnclEndCh(){
  $( '#confirmationClose' ).hide("slide", { direction: "left" }, 300);
  $( '#endChatBtn' ).show();

}


function closeToggle() {
	$( '#closeToggle' ).toggle("blind", {}, 500);
}
function createCase( username, real_name, interaction_id, notes ){
	//creating containers for chats and notes, and creating user in userlist
	const tools = $( '.tools-container' );
	const chats = $( '.chats-container' );
	const userList = $( '#UseraddList' );
	const User = $ ("<tr style='cursor: pointer;'><td class='user' data-userid='"+interaction_id+"'>" + real_name + " </td> </tr>");
	const chatBox = $("<div style='' class='chat-container' id='"+interaction_id+"'data-username='"+username+"' data-activechat='false'><table class='table table-striped'><tbody><div class='message-container'> </div></tbody></table></div>").hide();
	var verified = 'penis';
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
	systemMessage('<br/>New Interaction ' + interaction_id + ' has been created. Stand by as your connected to the next available agent.', interaction_id );
	systemMessage('Interaction ' + interaction_id + ' has been assigned to <b>'+agent_name+'</b> <hr />', interaction_id);
}
function closeInt(data){
    systemMessage('This interaction has been closed by <b>'+ data['real_name'] + '</b>.<br/> Please start a new interaction if you require additional assistance.', data['interaction_id']);

    //disable container to prevent messages
    interaction_id = '#' + data['interaction_id'];
    $( interaction_id ).attr('data-disabled', 'true');

    //check if current container is the interaction and disable
    const activeChat = $('div').find('*[data-activechat="true"]');
    if( activeChat.attr('data-disabled') == 'true' ){
       $( '#EntryBox' ).prop('disabled', true);
    }
}
function systemMessage(message, interaction_id){
	const sys_message = '<i><div class="text-dark">' + message + '</div></i>';
	interaction_id = '#' + interaction_id + ' tbody';
	$( interaction_id ).append('<center>' + sys_message + '</center>');

}
function alertUser(interaction_id, alrt){
	const userInList = $('.user[data-userid="'+interaction_id+'"]' );
	if( alrt == true){
	userInList.css('color', 'red');
  document.title = '*New Message*';
} else {
	userInList.css('color', 'black');
}

}
$(document).ready(function () {

})

document.addEventListener("visibilitychange", function() {
  if(document.visibilityState){
		document.title = 'Internal Support';
	}
});
