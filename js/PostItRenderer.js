function PostItRenderer() {}

function clean(value) {
    return (value === undefined || value === null) ? '' : value;
}

function timeColumn(value) {
    var wrap = $('<span class="time"><span class="time-number"></span><hr/><hr/><hr/><hr/><hr/><hr/><hr/><hr/><hr/></span>');
    wrap.find('.time-number').text(clean(value));
    return wrap;
}

PostItRenderer.prototype = {

    render: function(card) {
        var postIt = $('<div class="post-it"></div>');
        postIt.addClass('status-' + card.status);
        postIt.attr('data-card-id', card.identifier());
        var column1 = $('<div class="col col1"></div>');
        var column2 = $('<div class="col col2"></div>');
        var column3 = $('<div class="col col3"></div>');
        var bottom = $('<div class="bottom"><span class="bug"></span><span class="extra"></span></div>');

        column1.append($('<span class="id"></span>').text(clean(card.id)));
        column1.append($('<span class="priority"></span>').text(clean(card.priority)));
        column1.append($('<span class="name"></span>').text(clean(card.name)));

        column2.append($('<span class="speciality"></span>').text(clean(card.specialist1)));
        column2.append(timeColumn(card.time1));

        column3.append($('<span class="speciality"></span>').text(clean(card.specialist2)));
        column3.append(timeColumn(card.time2));

        bottom.append($('<span class="sprint"></span>').text(clean(card.sprint)));
        bottom.append($('<span class="status"></span>').text(clean(card.status)));

        postIt.append(column1);
        postIt.append(column2);
        postIt.append(column3);
        postIt.append(bottom);

        return postIt;
    }
};
