var myDataRef = new Firebase('https://kanban-task-gen.firebaseio.com/web/data/users/henriqueso/tasks');

var count = 0;

myDataRef.on('child_added', function(snapshot) {

	var data = snapshot.val();

	count = data.id;

	var page = new Page();
    page.parseStories({'tasks' : [data]});


}, function (errorObject){

	console.log('The read failed: ' + errorObject.code);

});

$( "#postit-form" ).submit(function( event ) {
 	event.preventDefault();

 	count++;
 	
 	var task = { 
 		'id' : count,
 		'name' : $( '#name' ).val() ,
 		'priority' : $( '#priority' ).val() ,
 		'sprint' : $( '#sprint' ).val() ,
 		'specialist1' : $( '#specialist1' ).val(),
 		'time1' : $( '#time1' ).val(),
 		'specialist2' : '',
 		'time2' : ''
 	};

	myDataRef.push(task);

	this.reset();
});