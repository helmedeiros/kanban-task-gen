function DemoBoardSeed() {}

DemoBoardSeed.prototype = {

    cards: function() {
        return [
            { id: '1',  name: 'Spike: investigate caching layer', status: 'doing', priority: '1', sprint: '24', specialist1: 'BE', time1: '4', specialist2: 'DBA', time2: '2', bug: false, extra: true },
            { id: '2',  name: 'Login button hidden on small phones', status: 'todo', priority: '1', sprint: '24', specialist1: 'FE', time1: '2', specialist2: '', time2: '', bug: true, extra: false },
            { id: '3',  name: 'Welcome email copy review', status: 'todo', priority: '3', sprint: '25', specialist1: 'UX', time1: '1', specialist2: 'PM', time2: '1', bug: false, extra: false },
            { id: '4',  name: 'Migration to Postgres 9.4', status: 'doing', priority: '1', sprint: '24', specialist1: 'BE', time1: '6', specialist2: 'DBA', time2: '4', bug: false, extra: true },
            { id: '5',  name: 'Dark mode toggle persists across reloads', status: 'done', priority: '2', sprint: '23', specialist1: 'FE', time1: '3', specialist2: '', time2: '', bug: true, extra: false },
            { id: '6',  name: 'A/B test the signup CTA copy', status: 'todo', priority: '2', sprint: '25', specialist1: 'PM', time1: '1', specialist2: 'FE', time2: '2', bug: false, extra: true },
            { id: '7',  name: 'Reduce CI build time below 90 seconds', status: 'doing', priority: '3', sprint: '24', specialist1: 'BE', time1: '5', specialist2: '', time2: '', bug: false, extra: false },
            { id: '8',  name: 'Customer interview write-up — March cohort', status: 'done', priority: '3', sprint: '23', specialist1: 'PM', time1: '2', specialist2: 'UX', time2: '1', bug: false, extra: false },
            { id: '9',  name: 'Password reset flow', status: 'todo', priority: '1', sprint: '25', specialist1: 'BE', time1: '3', specialist2: 'FE', time2: '2', bug: false, extra: false },
            { id: '10', name: 'Refactor PaymentService for retries', status: 'done', priority: '1', sprint: '23', specialist1: 'BE', time1: '8', specialist2: 'QA', time2: '3', bug: false, extra: true }
        ];
    },

    seedInto: function(repository) {
        var deferred = $.Deferred();
        if (!repository) {
            deferred.resolve(0);
            return deferred.promise();
        }
        var list = this.cards();
        if (!list.length) {
            deferred.resolve(0);
            return deferred.promise();
        }
        var state = { remaining: list.length, deferred: deferred, total: list.length };
        for (var i = 0; i < list.length; i++) {
            scheduleSeedAdd(repository, list[i], state);
        }
        return deferred.promise();
    }
};

function scheduleSeedAdd(repository, card, state) {
    repository.add(card).then(
        function() { settleSeed(state); },
        function() { settleSeed(state); }
    );
}

function settleSeed(state) {
    state.remaining--;
    if (state.remaining === 0) {
        state.deferred.resolve(state.total);
    }
}
