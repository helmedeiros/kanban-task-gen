function BoardImporter() {}

function scheduleAdd(repository, card, state) {
    repository.add(card).then(
        function() { tally(state, 'imported'); },
        function() { tally(state, 'failed'); }
    );
}

function tally(state, bucket) {
    state[bucket]++;
    state.remaining--;
    if (state.remaining === 0) {
        state.deferred.resolve({
            imported: state.imported,
            skipped: state.skipped,
            failed: state.failed
        });
    }
}

function findMatch(existing, candidate) {
    for (var k in existing) {
        if (existing.hasOwnProperty(k)) {
            var c = existing[k];
            if (c.id === candidate.id && c.name === candidate.name) {
                return k;
            }
        }
    }
    return null;
}

BoardImporter.prototype = {

    isSnapshot: function(parsed) {
        return !!(parsed && parsed.board && parsed.tasks);
    },

    importInto: function(parsed, repository) {
        var deferred = $.Deferred();
        var empty = { imported: 0, skipped: 0, failed: 0 };
        if (!this.isSnapshot(parsed) || !repository) {
            deferred.resolve(empty);
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
            deferred.resolve(empty);
            return deferred.promise();
        }
        repository.getAll().then(function(existing) {
            existing = existing || {};
            var fresh = [];
            var skipped = 0;
            for (var i = 0; i < keys.length; i++) {
                var task = tasks[keys[i]];
                if (findMatch(existing, task)) {
                    skipped++;
                } else {
                    fresh.push(task);
                }
            }
            if (!fresh.length) {
                deferred.resolve({ imported: 0, skipped: skipped, failed: 0 });
                return;
            }
            var state = {
                remaining: fresh.length,
                imported: 0,
                skipped: skipped,
                failed: 0,
                deferred: deferred
            };
            for (var j = 0; j < fresh.length; j++) {
                scheduleAdd(repository, fresh[j], state);
            }
        });
        return deferred.promise();
    }
};
