function FunnelAnalyzer() {}

FunnelAnalyzer.STAGES = [
    { key: 'acquisition', label: 'Acquisition', description: 'Sessions started' },
    { key: 'activation',  label: 'Activation',  description: 'Cards created' },
    { key: 'retention',   label: 'Retention',   description: 'Days returned' },
    { key: 'referral',    label: 'Referral',    description: 'Shared the board' },
    { key: 'revenue',     label: 'Revenue',     description: 'Paid action' }
];

FunnelAnalyzer.prototype = {

    compute: function(events) {
        var counts = {
            acquisition: 0,
            activation: 0,
            retention: 0,
            referral: 0,
            revenue: 0
        };
        var days = {};
        for (var i = 0; i < events.length; i++) {
            var e = events[i];
            if (e.name === 'app_loaded') {
                counts.acquisition++;
                days[dayBucket(e.t)] = true;
            } else if (e.name === 'card_created') {
                counts.activation++;
            } else if (e.name === 'board_shared' || e.name === 'share_clicked') {
                counts.referral++;
            } else if (e.name === 'revenue') {
                counts.revenue++;
            }
        }
        var dayCount = 0;
        for (var d in days) {
            if (days.hasOwnProperty(d)) {
                dayCount++;
            }
        }
        counts.retention = Math.max(0, dayCount - 1);
        return counts;
    },

    distribution: function(events) {
        var counts = {};
        for (var i = 0; i < events.length; i++) {
            var name = events[i].name;
            counts[name] = (counts[name] || 0) + 1;
        }
        var list = [];
        for (var n in counts) {
            if (counts.hasOwnProperty(n)) {
                list.push({ name: n, count: counts[n] });
            }
        }
        list.sort(function(a, b) {
            if (b.count !== a.count) { return b.count - a.count; }
            return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
        });
        return list;
    },

    sessionsByDay: function(events) {
        var byDay = {};
        for (var i = 0; i < events.length; i++) {
            var e = events[i];
            if (e.name !== 'app_loaded' && e.name !== 'card_created') {
                continue;
            }
            var day = dayBucket(e.t);
            if (!byDay[day]) {
                byDay[day] = { day: day, sessions: 0, cards: 0 };
            }
            if (e.name === 'app_loaded') {
                byDay[day].sessions++;
            } else {
                byDay[day].cards++;
            }
        }
        var days = [];
        for (var d in byDay) {
            if (byDay.hasOwnProperty(d)) {
                days.push(d);
            }
        }
        days.sort();
        var series = [];
        for (var j = 0; j < days.length; j++) {
            series.push(byDay[days[j]]);
        }
        return series;
    },

    conversion: function(counts) {
        var rates = {};
        var keys = ['acquisition', 'activation', 'retention', 'referral', 'revenue'];
        var base = counts.acquisition;
        for (var i = 1; i < keys.length; i++) {
            var curr = counts[keys[i]];
            rates[keys[i]] = base > 0 ? Math.round((curr / base) * 1000) / 10 : 0;
        }
        return rates;
    }
};

function dayBucket(timestamp) {
    var d = new Date(timestamp);
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
