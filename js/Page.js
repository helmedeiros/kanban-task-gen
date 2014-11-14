function Page() {}


Page.prototype = {

    catchPostIts: function(configuration) {
        $.ajax({
            type: 'GET',
            url: configuration.url,
            dataType: 'json',
            contentType: "application/x-www-form-urlencoded;charset=UTF-8",
            success: function(_data) {
                this.data = _data;
            },
            error: function(_data) {
                console.log('error', _data);
            }
        });
    },

    buildPostIt: function(story) {
        var postIt = $('<div class="post-it"></div>');
        var column1 = $('<div class="col col1"></div>');
        var column2 = $('<div class="col col2"></div>');
        var column3 = $('<div class="col col3"></div>');
        var bottom = $('<div class="bottom"><span class="bug"></span><span class="extra"></span></div>');

        column1.append($('<span class="id">' + story.id + '</span>'));
        column1.append($('<span class="priority">' + story.priority + '</span>'));
        column1.append($('<span class="name">' + story.name + '</span>'));

        column2.append($('<span class="speciality">' + story.specialist1 + '</span>'));
        column2.append($('<span class="time"><span class="time-number">' + story.time1 + '</span><hr/><hr/><hr/><hr/><hr/><hr/><hr/><hr/><hr/></span>'));

        column3.append($('<span class="speciality">' + story.specialist2 + '</span>'));
        column3.append($('<span class="time"><span class="time-number">' + story.time2 + '</span><hr/><hr/><hr/><hr/><hr/><hr/><hr/><hr/><hr/></span>'));

        bottom.append($('<span class="sprint">' + story.sprint + '</span>'));

        postIt.append(column1);
        postIt.append(column2);
        postIt.append(column3);
        postIt.append(bottom);

        return postIt;
    },

    parseStorySet: function(rawJson) {
        var stories = [];
        var tasks = (rawJson && rawJson.tasks) || {};
        for (var key in tasks) {
            if (tasks.hasOwnProperty(key)) {
                stories.push(tasks[key]);
            }
        }
        return stories;
    },

    parseStories: function(_data) {
        var cont = 0;

        for (var a in _data.tasks) {
            cont += 1;

            var postIt = this.buildPostIt(_data.tasks[a]);

            if ((cont === 7) || (cont === 8)) {
                postIt.addClass('page-end');

                if (cont === 8) {
                    cont = 0;
                }
            }

            $('#post-its').append(postIt);
        }
    }
};
