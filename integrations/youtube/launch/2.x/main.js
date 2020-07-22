/*
 * ADOBE SYSTEMS INCORPORATED
 * Copyright 2014 Adobe Systems Incorporated
 * All Rights Reserved.

 * NOTICE:  Adobe permits you to use, modify, and distribute this file in accordance with the
 * terms of the Adobe license agreement accompanying it.  If you have received this file from a
 * source other than Adobe, then your use, modification, or distribution of it requires the prior
 * written permission of Adobe.
 */

 
    // The VA Launch extension returns a Promise based API to create an instance of MediaHeartbeat.
    // This helper tries to reuse existing code by queuing events till the Promise completes.
    // Use the Promise based API directly for more control on handling errors.
    var MediaHeartbeatAdapter = (function(MediaHeartbeat) {
      function MediaHeartbeatAdapter(delegate, config) {
        this._queuedAPICalls = [];
        this._tracker = null;
        this._creatingTracker = true;
        this._internalError = false;
  
      var self = this;
        MediaHeartbeat.getInstance(delegate, config).then(function(tracker) {
          self._creatingTracker = false;
          self._tracker = tracker;
  
          self._queuedAPICalls.forEach(function(apiCall) {
            self[apiCall.name].apply(self, apiCall.arguments);
          });
        }).catch(function(error) {
          console.log(error);
          self._internalError = true;
        });
      }

      var apis = ['trackSessionStart', 'trackSessionEnd', 'trackComplete', 'trackPlay', 'trackPause', 'trackEvent', 'trackError'];
      apis.forEach(function(api) {
        MediaHeartbeatAdapter.prototype[api] = function() {
          if (this._internalError) {
            console.log('Error creating MediaHeartbeat instance. API call is dropped.');
            return;
          }
  
          if (this._creatingTracker) {
            console.log('Creating MediaHeartbeat instance. Queuing current API call.');
            this._queuedAPICalls.push({
              name : api,
              arguments : arguments
            });
            return;
          }
  
          this._tracker[api].apply(this._tracker, arguments);
        };
      });
  
      return MediaHeartbeatAdapter;
    })(ADB.MediaHeartbeat);


(function () {

    var MediaHeartbeat = ADB.MediaHeartbeat;
    var MediaHeartbeatDelegate = ADB.MediaHeartbeatDelegate;

    YoutubeDelegate.prototype = new MediaHeartbeatDelegate();
    function YoutubeDelegate(player) {
        this._player = player;
    }
    YoutubeDelegate.prototype.getCurrentPlaybackTime = function() {
        return this._player.getCurrentTime(); 
    };
        
    var tracker;
    var player;
    var isTracking = false;

    function startSessionIfNecessary() {
        if (isTracking) {
            return;
        }

        tracker = new MediaHeartbeatAdapter(new YoutubeDelegate(player));

        var videoInfo = player.getVideoData();

        var name = !!videoInfo.title ? videoInfo.title : "unknown";
        var mediaInfo = MediaHeartbeat.createMediaObject(name, videoInfo.video_id, player.getDuration(), MediaHeartbeat.StreamType.VOD, MediaHeartbeat.MediaType.Video);
        var metadata = {};
        // Standard metadata
        metadata[MediaHeartbeat.VideoMetadataKeys.Show] = "show";
        // Custom metadata
        metadata["author"] = "author";
        tracker.trackSessionStart(mediaInfo, metadata);
        
        isTracking = true;
    }

    function endSession(isComplete) {
        if (!isTracking) {
            return;
        }

        if (isComplete) {
            tracker.trackComplete();
        } else {
            tracker.trackSessionEnd();
        }
        
        isTracking = false;
    }

    function onPlayerStateChange(event) {        
        if (event.data == YT.PlayerState.UNSTARTED) {
            endSession(false);
        } else if (event.data == YT.PlayerState.ENDED) {
            endSession(true);
        } else if (event.data == YT.PlayerState.PLAYING) {
            startSessionIfNecessary();
            tracker.trackPlay();
        } else if (event.data == YT.PlayerState.PAUSED) {
            startSessionIfNecessary();
            tracker.trackPause();
        } else if (event.data == YT.PlayerState.BUFFERING) {
            startSessionIfNecessary();
            tracker.trackEvent(MediaHeartbeat.Event.BufferStart);
        }
    }

    window.onYouTubeIframeAPIReady = function () {
        player = new YT.Player('player', {
            height: '360',
            width: '640',
            videoId: 'zo7XWENN0VU',            
            events: {
                'onStateChange': onPlayerStateChange,                                
            }
        });                
    }

    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

})();