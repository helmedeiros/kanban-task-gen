function Page(renderer, target) {
    this.renderer = renderer || new PostItRenderer();
    this.target = target || $('#post-its');
}


Page.prototype = {

    parseCardSet: function(rawJson) {
        var cards = [];
        var tasks = (rawJson && rawJson.tasks) || {};
        for (var key in tasks) {
            if (tasks.hasOwnProperty(key)) {
                cards.push(new Card(tasks[key]));
            }
        }
        return cards;
    },

    render: function(_data) {
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

            this.target.append(postIt);
        }
    }
};
