function CardModal(deps) {
    this.el = deps.el;
    this.renderer = deps.renderer;
    var self = this;
    this.el.on('click', '.card-modal-close, .card-modal-backdrop', function() { self.hide(); });
}

CardModal.prototype.show = function(card, options) {
    var self = this;
    options = options || {};

    var body = this.el.find('.card-modal-body').empty();
    body.append(this.renderer.render(card));

    var actions = this.el.find('.card-modal-actions').empty();
    if (options.onStatusChange) {
        var statuses = ['todo', 'doing', 'done'];
        for (var i = 0; i < statuses.length; i++) {
            actions.append(buildStatusButton(statuses[i], card.status, options.onStatusChange, self));
        }
    }
    if (options.onDelete) {
        actions.append(buildDeleteButton(options.onDelete, options.confirmDelete, self));
    }

    this.el.addClass('is-open').attr('aria-hidden', 'false');
};

CardModal.prototype.hide = function() {
    this.el.removeClass('is-open').attr('aria-hidden', 'true');
    this.el.find('.card-modal-body').empty();
    this.el.find('.card-modal-actions').empty();
};

function buildDeleteButton(onDelete, confirmDelete, modal) {
    var btn = $('<button type="button" class="card-modal-delete">Delete</button>');
    btn.on('click', function() {
        var confirmFn = confirmDelete || function() { return window.confirm('Delete this card? This cannot be undone.'); };
        if (!confirmFn()) {
            return;
        }
        onDelete();
        modal.hide();
    });
    return btn;
}

function buildStatusButton(status, currentStatus, onChange, modal) {
    var btn = $('<button type="button" class="card-modal-status"></button>')
        .attr('data-status', status)
        .text(status);
    if (status === currentStatus) {
        btn.addClass('is-current');
    }
    btn.on('click', function() {
        onChange(status);
        modal.hide();
    });
    return btn;
}
