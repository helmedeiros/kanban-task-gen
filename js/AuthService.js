function AuthService(rootRef) {
    this.rootRef = rootRef;
}

AuthService.prototype = {

    signInWith: function(provider) {
        var deferred = $.Deferred();
        this.rootRef.authWithOAuthPopup(provider, function(err, user) {
            if (err) {
                deferred.reject(err);
            }
            if (user) {
                deferred.resolve(user);
            }
        });
        return deferred.promise();
    },

    signInWithPassword: function(credentials) {
        var deferred = $.Deferred();
        this.rootRef.authWithPassword(credentials, function(err, user) {
            if (err) {
                deferred.reject(err);
            }
            if (user) {
                deferred.resolve(user);
            }
        });
        return deferred.promise();
    },

    signInAnonymously: function() {
        var deferred = $.Deferred();
        this.rootRef.authAnonymously(function(err, authData) {
            if (authData) {
                deferred.resolve(authData);
            }
            if (err) {
                deferred.reject(err);
            }
        });
        return deferred.promise();
    },

    createUser: function(credentials) {
        var deferred = $.Deferred();
        this.rootRef.createUser(credentials, function(err) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });
        return deferred.promise();
    },

    currentUser: function() {
        return this.rootRef.getAuth();
    },

    signOut: function() {
        this.rootRef.unauth();
    },

    onChange: function(callback) {
        this.rootRef.onAuth(callback);
    },

    signUpAndSignIn: function(credentials) {
        var self = this;
        return this.createUser(credentials).then(function() {
            return self.signInWithPassword(credentials);
        });
    }
};
