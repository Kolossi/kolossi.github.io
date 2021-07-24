define(
    'smp/continuous',
    [
        'jquery-1.9',
        'istats-1',
        'ab',
        'images',
        'smp/login-check'
    ],
    function ($, Istats, AB, Images, LoginCheck) {

    /**
     *
     *
     * Scenarios:
     * TLEO Episode, not part of collection
     * TLEO Episode, is part of collection
     *
     *
     */


    var ContinuousPlay = function (data, options) {
        this.pid = data.pid;
        this.next = data.nextPid;
        this.parent = data.parentPid;
        this.contextType = 'programme';
        this.nextUrl = null;
        this.nextPlaylist = null;
        this.currentUrl = null;
        this.loggedSuccess = false;
        this.prefetched = false;
        this.backgroundPrefetched = false;
        this.playNext = true;
        this.options = {};
        this.backgroundPlaying = false;
        this.images = new Images();
        this.setOptions(options);
        this.init();
    };

    ContinuousPlay.prototype = {
        initial_options : {
            sessionStorageKey : 'BBCProgrammes_ContinuousPlayData'
        },
        setOptions : function (options) {
            this.options = $.extend(true, {}, this.initial_options, options);
        },
        log : function(key) {
            Istats.log('click' ,'programmes_' + key);
            if (this.ab.isInTest()) {
                Istats.log('click' ,'programmes_ab_' + this.ab.getBucket() + '_' + key);
            }
        },
        init : function() {
            if (
                !document.querySelectorAll ||
                !sessionStorage ||
                $( document ).width() < 800 ||
                this.nopeIsInUrl() ||
                !LoginCheck.isUserLoggedIn()
            ) {
                // escape
                return;
            }

            this.ab = new AB(0.5, 'ContinuousPlay', 3);
            this.panel = $('.js-continuous-play-panel');

            // fire some initial stats tracking
            this.log('episode_view');

            if (this.playIsInUrl()) {
                this.log('episode_view_with_autoplay');
            }
            this.sessionData = this.getSessionData();
            if (!this.sessionData.autoplay_active) {
                this.playNext = false;
            }

            this.wasExpectedPid = (this.sessionData.episode_play_expected_next_pid == this.pid);
            if (!this.wasExpectedPid) {
                // reset the stream listening time
                this.sessionData.total_stream_listening_time = 0;
            }

            this.getContext();
            this.addListeners();
        },
        getSessionData : function() {
            stored = sessionStorage.getItem(this.options.sessionStorageKey);
            if (stored) {
                return JSON.parse(stored);
            }
            return {
                episode_play_session_count : 0,
                episode_play_expected_next_pid : null,
                episode_play_stream_count : 0,
                total_session_listening_time : 0,
                total_stream_listening_time : 0,
                previously_ended_stream : false,
                autoplay_active : true,
                previously_registered: false
            };
        },
        saveSessionData : function() {
            sessionStorage.setItem(this.options.sessionStorageKey, JSON.stringify(this.sessionData));
        },
        nopeIsInUrl : function() {
            var hash = window.location.hash;
            return (hash.indexOf('nope') > -1); /* if the hash contains the word nope, end */
        },
        playIsInUrl : function() {
            var hash = window.location.hash;
            return (hash.indexOf('play') > -1); /* if the hash contains the word play */
        },
        parseQuery : function (qstr) {
            var query = {};
            var a = qstr.split('&');
            for (var i = 0; i < a.length; i++) {
                var b = a[i].split('=');
                query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
            }
            return query;
        },
        getContext : function() {
            var _this = this,
                contextFragment = window.location.hash.replace('#',''), // remove the hash
                context = this.parseQuery(contextFragment),
                contextData,
                url, id;
            if (!this.ab.is('B') && !this.ab.is('C')) {
                return;
            }

            this.contextType = 'programme';
            id = this.parent;
            if (context.in) {
                contextData = context.in.split(':');
                if (contextData[0] == 'collection') {
                    this.contextType = 'collection';
                    id = contextData[1];
                }
            }

            if (!id) {
                return; // no context. escape
            }

            // fragment structure
            // section-section-section
            // within a section
            // part=value
            // eg: #play&in=collection:p0012345

            url = '/programmes/_labs/stream?type=' +
                this.contextType +
                '&id=' +
                id +
                '&current=' +
                this.pid;

            //
            if (contextFragment) {
                contextFragment = '#' + contextFragment;
            }
            this.panel.html('<p class="loading-spinner"></p>');
            this.panel.load(
                url,
                function() {
                    var next, copy, nextLi;

                    _this.panel.find('[data-continuous-status="previous"] .programme__img').append(
                        '<div class="programme__status programme__status--dull text--shout">Previous</div>'
                    );

                    if (_this.ab.is('B')) {
                        _this.panel.find('[data-continuous-status="current"] .programme__img').append(
                            '<div class="programme__status text--shout">Current</div>'
                        );

                        _this.panel.find('[data-continuous-status="next"] .programme__img').append(
                            '<div class="programme__status programme__status--dull text--shout">Next</div>'
                        );
                    }

                    if (_this.ab.is('C')) {
                        _this.setAutoplay(_this.sessionData.autoplay_active);
                        _this.panel.find('.continuous__autoplay-toggle').removeClass('hidden');

                        nextLi = _this.panel.find('[data-continuous-status="next"]');
                        if (nextLi.length) {
                            _this.nextPlaylist = JSON.parse(
                                nextLi.attr('data-continuous-playlist')
                            );
                        }

                        copy = _this.panel.find('[data-continuous-status="next"] .programme').clone();
                        copy.addClass('programme--grid').find('.programme__img').removeClass('five-twelfths');
                        _this.panel.find('.continuous__next').append(copy);

                        _this.panel.find('[data-continuous-status="current"] .programme__img').append(
                            '<div class="programme__status text--shout">Now playing</div>'
                        );

                        _this.panel.find('[data-continuous-status="next"] .programme__img').append(
                            '<div class="programme__status text--shout continuous__next-label">Up next</span></div>'
                        );
                    }
                    _this.panel.find(
                        '[data-linktrack="programmeobjectlink=title"],' +
                        '[data-linktrack="programmeobjectlink=blocklink"]'
                    ).each(function(i, link) {
                        link.href = link.href + contextFragment;
                    });

                    next = _this.panel.find('[data-continuous-status="next"] [data-pid]');
                    if (next.length) {
                        _this.next = next.attr('data-pid');
                        _this.nextUrl = '//' + window.location.hostname + '/programmes/' + _this.next + '#play';
                        if (context.in) {
                            _this.nextUrl += '&in=' + context.in;
                        }
                    }

                    _this.images.switchImagesSrc(_this.panel);
                }
            );


            // load the relevant ajax panel.
            // get the "next" value out of that
        },
        setNextPlaylist : function() {
            var options;
            if (!this.nextPlaylist || !this.nextPlaylist.defaultAvailableVersion) return;

            options = {
                statsObject: this.nextPlaylist.statsObject
            };
            $('body').trigger(
                'smp-queue-new',
                [
                    this.nextPlaylist.statsObject.parentPID,
                    this.nextPlaylist.defaultAvailableVersion.smpConfig,
                    options
                ]
            );
        },
        setAutoplay : function(state) {
            $('.continuous__autoplay-toggle').html('Autoplay: ' + (state ? 'On' : 'Off'));
            this.playNext = state;
            this.sessionData.autoplay_active = state;
            this.saveSessionData();
        },
        prefetchNext : function() {
            var body = $('body'),
                url;
            if (!this.prefetched) {
                // remove the hash
                $('<iframe style="display: none" src="' +
                    this.nextUrl.substring(0, this.nextUrl.indexOf('#')) +
                    '#nope"></iframe>').appendTo(body);
                this.prefetched = true;
            }
        },
        backgroundPrefetch : function() {
            if (this.backgroundPlaying && !this.backgroundPrefetched) {
                this.pid = this.next;
                this.getContext();
                this.backgroundPrefetched = true;
            }
        },
        registerSuccess : function() {
            var track = 'episode_play_success_' + ((this.playIsInUrl()) ? 'autoplay_true' : 'autoplay_false');

            this.log(track);

            if (this.ab.isInTest()) {
                if (this.sessionData.previously_ended_stream) {
                    // register if a new stream was started after a previous one ended
                    this.log('episode_play_after_completed_stream');
                    this.sessionData.previously_ended_stream = false;
                }

                if (!this.sessionData.previously_registered) {
                    this.sessionData.episode_play_session_count++;
                    if (this.sessionData.episode_play_expected_next_pid == this.pid) {
                        this.sessionData.episode_play_stream_count++;
                    } else {
                        this.sessionData.episode_play_stream_count = 1;
                    }

                    this.log('session_count_' + this.sessionData.episode_play_session_count);
                    this.log('stream_count_' + this.sessionData.episode_play_stream_count + '_' + this.contextType);
                }

                this.sessionData.episode_play_expected_next_pid = this.next;
                this.sessionData.previously_registered = false;
                this.saveSessionData();

            }
        },
        incrementListeningTime : function() {
            var minutes;
            this.sessionData.total_session_listening_time++;
            this.sessionData.total_stream_listening_time++;

            // fire the latest number every 5 minutes
            if (
                this.sessionData.total_session_listening_time &&
                this.sessionData.total_session_listening_time % 300 === 0
            ) {
                minutes = this.sessionData.total_session_listening_time / 60;
                this.log('session_minutes_cumulative_' + minutes);
            }

            // fire the latest number every 5 minutes
            if (
                this.sessionData.total_stream_listening_time &&
                this.sessionData.total_stream_listening_time % 300 === 0
            ) {
                minutes = this.sessionData.total_stream_listening_time / 60;
                this.log('stream_minutes_cumulative_' + minutes);
            }

            // re-save to session storage every 5 seconds
            if (this.sessionData.total_session_listening_time % 5 === 0) {
                this.saveSessionData();
            }


        },
        handleEnded : function() {
            var tleo = (this.contextType == 'programme' && !this.parent);
            if (this.ab.isInTest()) {
                if (!this.nextUrl && !tleo) {
                    // no nextUrl. Must be at the end of the stream?
                    this.log('episode_play_end_of_stream');
                    this.sessionData.previously_ended_stream = true;
                }
                this.saveSessionData();
            }
        },
        loadNext : function() {
            if (this.nextUrl) {
                if (this.ab.is('C') && this.playNext) {
                    $('body').trigger('smp-destroy');
                    window.location.href = this.nextUrl;
                }
            }
        },
        loadCurrent : function() {
            if (this.nextUrl) {
                if (this.ab.is('C') && this.playNext) {
                    this.sessionData.previously_registered = true;
                    this.saveSessionData();
                    window.location.href = this.currentUrl;
                }
            }
        },
        countdown : function(secondsLeft) {
            if (0 == secondsLeft) {
                if (this.ab.is('C') && this.playNext) {
                    this.setNextPlaylist();
                    $('.js-continuous-next').html('Loading...');
                }
                $('.continuous__stop').remove();
            } else {
                $('.js-continuous-next').html('Up next in ' + secondsLeft + 's');
            }
        },
        removeCountdown : function() {
            var continuous = $('.continuous'),
                countdown = $('.continuous__countdown');
            countdown.addClass('hidden');
            continuous.removeClass('hidden');
        },
        backgroundPlay : function() {
            var _this = this,
                body = $('body'),
                visibilityChange;

            if (!this.ab.is('C') || !this.playNext) {
                return;
            }

            _this.loggedSuccess = false;
            _this.currentUrl = _this.nextUrl;

            if (!this.backgroundPlaying) {
                body.append('<div style="' +
                    'background:#444;background:rgba(0,0,0,0.6);position:fixed;top:0;left:0;right:0;bottom:0;z-index:1000;color:white' +
                    '"><span style="margin: 46% auto 0;width: 40px;display: block;" class="loading-spinner"></span></div>');

                if (typeof document.hidden !== "undefined") {
                    visibilityChange = "visibilitychange";
                } else if (typeof document.webkitHidden !== "undefined") {
                    visibilityChange = "webkitvisibilitychange";
                }
                document.addEventListener(visibilityChange, function () {
                    _this.loadCurrent();
                });
            }

            this.backgroundPlaying = true;
        },
        isInBackground : function() {
            if (document.visibilityState) {
                return (document.visibilityState == 'hidden');
            }
            if (document.webkitVisibilityState) {
                return (document.webkitVisibilityState == 'hidden');
            }
        },
        addListeners : function() {
            var body = $('body'),
                _this = this;

            body.on('smp-beat-second', function(event, data) {
                var currentSeconds = data.currentSeconds,
                    totalSeconds = data.totalSeconds,
                    secondsLeft = Math.floor(data.totalSeconds - data.currentSeconds),
                    continuous;

                // if play has gone beyond 30 seconds, log a success - once
                if (currentSeconds > 30 && !_this.loggedSuccess) {
                    _this.loggedSuccess = true;
                    _this.registerSuccess();
                }

                if (currentSeconds > 0) {
                    _this.backgroundPrefetch();
                }

                // in the last minute, prefetch the next page for speedy loading
                if (60 > (totalSeconds - currentSeconds)) {
                    _this.prefetchNext();
                }

                _this.incrementListeningTime();

                if (_this.ab.is('C')) {
                    continuous = $('.continuous');
                    if (_this.playNext && _this.nextUrl && 10 >= secondsLeft) {
                        continuous.addClass('hidden');
                        $('.continuous__countdown').removeClass('hidden');
                        _this.countdown(secondsLeft);
                    } else {
                        if (continuous.hasClass('hidden')) {
                            _this.removeCountdown();
                        }
                    }
                }
            });

            body.on('smp-started-manually', function(e) {
                _this.log('episode_user_smp_play');
            });


            body.on('smp-ended', function(e) {
                if (_this.isInBackground()) {
                    _this.backgroundPlay();
                    _this.prefetched = false;
                    _this.backgroundPrefetched = false;
                } else {
                    _this.handleEnded();
                    _this.loadNext();
                }
            });

            body.on('click', '.continuous__stop', function(e) {
                _this.log('episode_user_prevent_autoplay');
                _this.playNext = false;
                _this.removeCountdown();
            });

            body.on('click', '.continuous__autoplay-toggle', function(e) {
                if (_this.sessionData.autoplay_active) {
                    $('.continuous__next-label').addClass('hidden');
                    _this.log('episode_user_disable_autoplay');
                    _this.setAutoplay(false);
                } else {
                    $('.continuous__next-label').removeClass('hidden');
                    _this.log('episode_user_enable_autoplay');
                    _this.setAutoplay(true);
                }
            });
        }
    };

    return ContinuousPlay;
});