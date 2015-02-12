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

    conversion: function(counts) {
        var rates = {};
        var keys = ['acquisition', 'activation', 'retention', 'referral', 'revenue'];
        for (var i = 1; i < keys.length; i++) {
            var prev = counts[keys[i - 1]];
            var curr = counts[keys[i]];
            rates[keys[i]] = prev > 0 ? Math.round((curr / prev) * 1000) / 10 : 0;
        }
        return rates;
    }
};

function dayBucket(timestamp) {
    var d = new Date(timestamp);
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
