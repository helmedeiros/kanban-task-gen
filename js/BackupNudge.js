function BackupNudge(opts) {
    opts = opts || {};
    this.minCards = opts.minCards || 5;
    this.staleDays = opts.staleDays || 7;
    this.dismissedThisSession = false;
}

BackupNudge.prototype = {

    shouldShow: function(events, cardCount, now) {
        if (this.dismissedThisSession) {
            return false;
        }
        if (cardCount < this.minCards) {
            return false;
        }
        var lastShare = lastShareAt(events);
        if (lastShare === null) {
            return true;
        }
        var nowMs = (now || new Date()).getTime();
        var ageMs = nowMs - lastShare;
        return ageMs >= this.staleDays * 24 * 60 * 60 * 1000;
    },

    dismiss: function() {
        this.dismissedThisSession = true;
    }
};

function lastShareAt(events) {
    var latest = null;
    for (var i = 0; i < events.length; i++) {
        if (events[i].name === 'board_shared') {
            if (latest === null || events[i].t > latest) {
                latest = events[i].t;
            }
        }
    }
    return latest;
}
