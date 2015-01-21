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
            for (var key in rawCards) {
                if (rawCards.hasOwnProperty(key)) {
                    var card = new Card(rawCards[key]);
                    var column = form.find('.board-column[data-status="' + card.status + '"] .board-column-cards');
                    column.append(renderer.render(card));
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
