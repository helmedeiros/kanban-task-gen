function PostItRenderer() {}

PostItRenderer.prototype = {

    render: function(card) {
        var postIt = $('<div class="post-it"></div>');
        postIt.addClass('status-' + card.status);
        postIt.attr('data-card-id', card.identifier());
        var column1 = $('<div class="col col1"></div>');
        var column2 = $('<div class="col col2"></div>');
        var column3 = $('<div class="col col3"></div>');
        var bottom = $('<div class="bottom"><span class="bug"></span><span class="extra"></span></div>');

        column1.append($('<span class="id">' + card.id + '</span>'));
        column1.append($('<span class="priority">' + card.priority + '</span>'));
        column1.append($('<span class="name">' + card.name + '</span>'));

        column2.append($('<span class="speciality">' + card.specialist1 + '</span>'));
        column2.append($('<span class="time"><span class="time-number">' + card.time1 + '</span><hr/><hr/><hr/><hr/><hr/><hr/><hr/><hr/><hr/></span>'));

        column3.append($('<span class="speciality">' + card.specialist2 + '</span>'));
        column3.append($('<span class="time"><span class="time-number">' + card.time2 + '</span><hr/><hr/><hr/><hr/><hr/><hr/><hr/><hr/><hr/></span>'));

        bottom.append($('<span class="sprint">' + card.sprint + '</span>'));
        bottom.append($('<span class="status">' + card.status + '</span>'));

        postIt.append(column1);
        postIt.append(column2);
        postIt.append(column3);
        postIt.append(bottom);

        return postIt;
    }
};
