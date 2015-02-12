function EventsController(deps) {
    this.analytics = deps.analytics;
    this.funnel = deps.funnel || new FunnelAnalyzer();
    this.chartFactory = deps.chartFactory || defaultChartFactory;
    this.confirmClear = deps.confirmClear || function() { return window.confirm('Clear local analytics log?'); };
    this.chart = null;
}

EventsController.prototype.attach = function(form) {
    var self = this;
    var events = this.analytics.list();

    var counts = this.funnel.compute(events);
    var rates = this.funnel.conversion(counts);

    renderFunnelStages(form.find('.funnel-stages'), counts, rates);
    this.chart = renderFunnelChart(form.find('.funnel-chart'), counts, this.chartFactory, this.chart);

    var list = form.find('.events-list').empty();
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

function renderFunnelStages(container, counts, rates) {
    container.empty();
    var stages = FunnelAnalyzer.STAGES;
    for (var i = 0; i < stages.length; i++) {
        var s = stages[i];
        var card = $(
            '<div class="funnel-stage">' +
            '<div class="funnel-stage-label"></div>' +
            '<div class="funnel-stage-count"></div>' +
            '<div class="funnel-stage-desc"></div>' +
            '<div class="funnel-stage-rate"></div>' +
            '</div>'
        );
        card.addClass('funnel-stage--' + s.key);
        card.find('.funnel-stage-label').text(s.label);
        card.find('.funnel-stage-count').text(counts[s.key]);
        card.find('.funnel-stage-desc').text(s.description);
        if (i === 0) {
            card.find('.funnel-stage-rate').text('Top of funnel');
        } else {
            card.find('.funnel-stage-rate').text(rates[s.key] + '% of acquisition');
        }
        container.append(card);
    }
}

function renderFunnelChart(canvas, counts, factory, previous) {
    if (!canvas.length) {
        return null;
    }
    if (previous && previous.destroy) {
        previous.destroy();
    }
    var stages = FunnelAnalyzer.STAGES;
    var labels = [];
    var values = [];
    for (var i = 0; i < stages.length; i++) {
        labels.push(stages[i].label);
        values.push(counts[stages[i].key]);
    }
    var data = {
        labels: labels,
        datasets: [{
            label: 'AARRR funnel',
            fillColor: 'rgba(78,154,205,0.65)',
            strokeColor: 'rgba(78,154,205,1)',
            highlightFill: 'rgba(78,154,205,0.85)',
            highlightStroke: 'rgba(78,154,205,1)',
            data: values
        }]
    };
    return factory(canvas[0], data);
}

function defaultChartFactory(canvasElement, data) {
    if (typeof Chart === 'undefined') {
        return null;
    }
    var ctx = canvasElement.getContext('2d');
    return new Chart(ctx).Bar(data, { responsive: false, scaleBeginAtZero: true });
}

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
