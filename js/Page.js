function Page(renderer) {
    this.renderer = renderer || new PostItRenderer();
}


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

    parseCardSet: function(rawJson) {
        var cards = [];
        var tasks = (rawJson && rawJson.tasks) || {};
        for (var key in tasks) {
            if (tasks.hasOwnProperty(key)) {
                cards.push(tasks[key]);
            }
        }
        return cards;
    },

    parseStories: function(_data) {
        var CARDS_PER_PAGE = 8;
        var cards = this.parseCardSet(_data);
        var cont = 0;

        for (var i = 0; i < cards.length; i++) {
            cont += 1;

            var postIt = this.renderer.render(cards[i]);

            if ((cont === CARDS_PER_PAGE - 1) || (cont === CARDS_PER_PAGE)) {
                postIt.addClass('page-end');

                if (cont === CARDS_PER_PAGE) {
                    cont = 0;
                }
            }

            $('#post-its').append(postIt);
        }
    }
};
