function BoardImporter() {}

function scheduleAdd(repository, card, state) {
    repository.add(card).then(function() {
        state.remaining--;
        if (state.remaining === 0) {
            state.deferred.resolve(state.total);
        }
    });
}

BoardImporter.prototype = {

    isSnapshot: function(parsed) {
        return !!(parsed && parsed.board && parsed.tasks);
    },

    importInto: function(parsed, repository) {
        var deferred = $.Deferred();
        if (!this.isSnapshot(parsed) || !repository) {
            deferred.resolve(0);
            return deferred.promise();
        }
        var tasks = parsed.tasks;
        var keys = [];
        for (var k in tasks) {
            if (tasks.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        if (!keys.length) {
            deferred.resolve(0);
            return deferred.promise();
        }
        var state = { remaining: keys.length, total: keys.length, deferred: deferred };
        for (var i = 0; i < keys.length; i++) {
            scheduleAdd(repository, tasks[keys[i]], state);
        }
        return deferred.promise();
    }
};
