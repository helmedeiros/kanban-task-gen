console.log('Kanban Task Gen v0.1');

$(function() {
	postIts = new PostIts();
	postIts.init();
});

var PostIts = function () {
	return {
		init: function () {		
			this.jsonUrl = "tasks.json";
			
			this.catchPostIts(this.jsonUrl);
		},
		
		catchPostIts: function (_url) {
			var self = this;
			
			$.ajax({
		        type: 'GET',
		        url: _url,
		        dataType: 'json',
				contentType: "application/x-www-form-urlencoded;charset=UTF-8",
		        success: function (_data) {
					self.parseStories(_data);
	        	},
	        	error: function (_data) {
					// AJAX error
	        		console.log('error', _data);
	        	}
     		});
		},
		
		parseStories: function (_data) {
			var self = this;
			var thePostIt = $('<div class="post-it"></div>');
			var column1 = $('<div class="col col1"></div>');
			var column2 = $('<div class="col col2"></div>');
			var column3 = $('<div class="col col3"></div>');
			var bottom = $('<div class="bottom"><span class="bug"></span><span class="extra"></span></div>');
			var cont = 0;
			
			for (var a in _data.tasks) {
				cont += 1;
				
				if ((cont === 7) || (cont === 8)) {
					thePostIt.addClass('page-end');
					
					if (cont === 8) {
						cont = 0;
					}
				}
				
				var story = _data.tasks[a];
				
				var idSpan = $('<span class="id">' + story.id + '</span>');
				var prioSpan = $('<span class="priority">' + story.priority + '</span>');
				var nameSpan = $('<span class="name">' + story.name + '</span>');
				
				var specialSpan1 = $('<span class="speciality">' + story.specialist1 + '</span>');
				var timeSpan1 = $('<span class="time"><span class="time-number">' + story.time1 + '</span><hr/><hr/><hr/><hr/><hr/><hr/><hr/><hr/><hr/></span>');
				
				var specialSpan2 = $('<span class="speciality">' + story.specialist2 + '</span>');
				var timeSpan2 = $('<span class="time"><span class="time-number">' + story.time2 + '</span><hr/><hr/><hr/><hr/><hr/><hr/><hr/><hr/><hr/></span>');
				
				var sprintSpan = $('<span class="sprint">' + story.sprint + '</span>');
				
				column1.append(idSpan);
				column1.append(prioSpan);
				column1.append(nameSpan);
				
				column2.append(specialSpan1);
				column2.append(timeSpan1);
				
				column3.append(specialSpan2);
				column3.append(timeSpan2);
				
				bottom.append(sprintSpan);
				
				thePostIt.append(column1);
				thePostIt.append(column2);
				thePostIt.append(column3);
				thePostIt.append(bottom);
				
				$('#post-its').append(thePostIt);
				
				thePostIt = $('<div class="post-it"></div>');
				column1 = $('<div class="col col1"></div>');
				column2 = $('<div class="col col2"></div>');
				column3 = $('<div class="col col3"></div>');
				bottom = $('<div class="bottom"><span class="bug"></span><span class="extra"></span></div>');
			}
		}
	}
}