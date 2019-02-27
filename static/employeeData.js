function stripHTML(msg) {
	var tmpDiv = document.createElement("div");
	tmpDiv.innerHTML = msg;
	return tmpDiv.textContent || tmpDiv.innerText || "";
}

$( '#EntryData' ).keyup( function(event){
  //enter event
  if ( event.keyCode == 13 ){

    //as long as it's not empty input
    if ( $( '#EntryData' ).val() == '\n' ) {
      $( '#EntryData' ).val('');
      return;
    }

    //grab the data
    const dataEntry = $( '#EntryData' );
    const data = stripHTML(dataEntry.val());
    dataEntry.val('');

    $( '#profile-notes-container' ).animate({
                 scrollTop: $( '#profile-notes-container' )[0].scrollHeight}, "slow");

    var today = new Date();

    var month = ((today.getMonth()+1) < 10 ? '0'+ (today.getMonth()+1) : (today.getMonth()+1));
    var date = (today.getDate() < 10 ? '0'+ today.getDate() : today.getDate());
    //update visually
    $( '<tr><td><small>'+today.getFullYear()+'-'+month+'-'+date+'</small></td><td><small>'+real_name+'</small></td><td><small>'+data+'</small></td></tr></small>' ).appendTo($('#noteTable'));
  	
	//post to flask
	const dataJson = {
			"sid" : sid,
			"type" : "note",
			"content" : data,
			"employee" : employee
		};
	$.post( '/employee/notate', dataJson );
	}

});
