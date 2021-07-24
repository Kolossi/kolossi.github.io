define('ab', function () {
    var AB = function (fraction, name, buckets) {
        this.fraction = fraction || 0.1;
        name = name || 'default';
        this.buckets = buckets || 2;
        this.key = "BBCProgrammes_AB_" + name;
        this.setup();
    };
    AB.prototype = {
        bucketLabels : ['A','B','C','D','E','F','G','H'],
        testState : {
            inTest : false,
            group : null
        },
        setup : function() {
            var stored;
            if (!sessionStorage) {
                return;
            }
            stored = sessionStorage.getItem(this.key);
            if (stored) {
                this.testState = JSON.parse(stored);
            } else {
                this.calculateGroup();
            }
            this.checkUrlOverride();
        },
        checkUrlOverride : function() {
            var hash = window.location.hash,
                index = hash.indexOf('ab-'),
                bucket = hash.charAt(index + 3);
            if (index < 0) {
                return;
            }
            this.testState.inTest = true;
            this.testState.group = bucket;
            this.save();
        },
        calculateGroup : function() {
            var inTest = Math.random(),
                buckets = this.bucketLabels.slice(0,this.buckets),
                group = buckets[Math.floor(Math.random()*buckets.length)];
            if (inTest < this.fraction) {
                this.testState.inTest = true;
                this.testState.group = group;
            }
            this.save();
        },
        save : function() {
            sessionStorage.setItem(this.key, JSON.stringify(this.testState));
        },
        isInTest : function() {
            return this.testState.inTest;
        },
        is : function(bucket) {
            return this.testState.inTest && this.testState.group == bucket;
        },
        getBucket : function() {
            return this.testState.group;
        },
        isA : function() {
            return this.is('A');
        }
    };
    return AB;
});
