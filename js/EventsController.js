function EventsController(deps) {
    this.analytics = deps.analytics;
    this.confirmClear = deps.confirmClear || function() { return window.confirm('Clear local analytics log?'); };
}

EventsController.prototype.attach = function(form) {
    var self = this;
    var list = form.find('.events-list').empty();
    var events = this.analytics.list();

    if (!events.length) {
        list.append($('<p class="events-empty">No events tracked yet.</p>'));
    } else {
        list.append(buildEventsTable(events));
    }

    form.find('.events-clear').off('click.events').on('click.events', function() {
        if (!self.confirmClear()) {
            return;
        }
        self.analytics.clear();
        self.attach(form);
    });
};

function buildEventsTable(events) {
    var table = $(
        '<table class="events-table">' +
        '<thead><tr><th>Time</th><th>Event</th><th>Properties</th></tr></thead>' +
        '<tbody></tbody>' +
        '</table>'
    );
    var tbody = table.find('tbody');
    for (var i = events.length - 1; i >= 0; i--) {
        var e = events[i];
        var tr = $('<tr></tr>');
        tr.append($('<td></td>').text(formatTime(e.t)));
        tr.append($('<td></td>').text(e.name));
        tr.append($('<td class="events-table-props"></td>').text(JSON.stringify(e.properties || {})));
        tbody.append(tr);
    }
    return table;
}

function formatTime(t) {
    var d = new Date(t);
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
           ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}
