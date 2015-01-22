function BoardController(deps) {
    this.renderer = deps.renderer;
    this.getBoardRepository = deps.getBoardRepository;
}

BoardController.prototype.attach = function(form) {
    var renderer = this.renderer;
    form.find('.board-column-cards').empty();
    updateCounts(form);

    var repo = this.getBoardRepository();
    if (!repo) {
        return;
    }

    repo.getAll().then(function(rawCards) {
        if (rawCards) {
            for (var fbKey in rawCards) {
                if (rawCards.hasOwnProperty(fbKey)) {
                    var card = new Card(rawCards[fbKey]);
                    var column = form.find('.board-column[data-status="' + card.status + '"] .board-column-cards');
                    var postIt = renderer.render(card).attr('data-fb-key', fbKey);
                    column.append(postIt);
                }
            }
        }
        updateCounts(form);
    });
};

function updateCounts(form) {
    form.find('.board-column').each(function() {
        var col = $(this);
        var count = col.find('.board-column-cards .post-it').length;
        var titleEl = col.find('.board-column-title');
        var base = titleEl.data('base');
        if (!base) {
            base = titleEl.text();
            titleEl.data('base', base);
        }
        titleEl.text(base + ' (' + count + ')');
    });
}
