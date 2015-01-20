function BoardController(deps) {
    this.renderer = deps.renderer;
    this.getBoardRepository = deps.getBoardRepository;
}

BoardController.prototype.attach = function(form) {
    var renderer = this.renderer;
    form.find('.board-column-cards').empty();

    var repo = this.getBoardRepository();
    if (!repo) {
        return;
    }

    repo.getAll().then(function(rawCards) {
        if (!rawCards) {
            return;
        }
        for (var key in rawCards) {
            if (rawCards.hasOwnProperty(key)) {
                var card = new Card(rawCards[key]);
                var column = form.find('.board-column[data-status="' + card.status + '"] .board-column-cards');
                column.append(renderer.render(card));
            }
        }
    });
};
