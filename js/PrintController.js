function PrintController(deps) {
    this.renderer = deps.renderer;
    this.getBoardRepository = deps.getBoardRepository;
    this.targetSelector = deps.targetSelector;
}

PrintController.prototype.attach = function(form) {
    var renderer = this.renderer;
    var target = form.find(this.targetSelector);
    target.empty();

    var repo = this.getBoardRepository();
    if (!repo) {
        return;
    }

    repo.getAll().then(function(rawCards) {
        if (!rawCards) {
            return;
        }
        for (var fbKey in rawCards) {
            if (rawCards.hasOwnProperty(fbKey)) {
                var card = new Card(rawCards[fbKey]);
                target.append(renderer.render(card).attr('data-fb-key', fbKey));
            }
        }
    });
};
