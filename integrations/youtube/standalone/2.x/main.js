/*
 * ADOBE SYSTEMS INCORPORATED
 * Copyright 2014 Adobe Systems Incorporated
 * All Rights Reserved.

 * NOTICE:  Adobe permits you to use, modify, and distribute this file in accordance with the
 * terms of the Adobe license agreement accompanying it.  If you have received this file from a
 * source other than Adobe, then your use, modification, or distribution of it requires the prior
 * written permission of Adobe.
 */

(function () {

    var MediaHeartbeat = ADB.va.MediaHeartbeat;
    var MediaHeartbeatConfig = ADB.va.MediaHeartbeatConfig;
    var MediaHeartbeatDelegate = ADB.va.MediaHeartbeatDelegate;

    // Set-up Visitor 
    var visitor = Visitor.getInstance('3CE342C75100435B0A490D4C@AdobeOrg');
    visitor.trackingServer = 'obumobile5.sc.omtrdc.net';
    // Set-up the AppMeasurement component.
    var appMeasurement = AppMeasurement.getInstance('mobile5vhl.sample.player');
    appMeasurement.visitor = visitor;
    appMeasurement.trackingServer = 'obumobile5.sc.omtrdc.net';
    appMeasurement.pageName = 'Sample Page Name';
    appMeasurement.charSet = "UTF-8";

    // Media initialization
    var mediaConfig = new MediaHeartbeatConfig();
    mediaConfig.trackingServer = 'obumobile5.hb.omtrdc.net';
    mediaConfig.playerName = 'youtube-sample-player';
    mediaConfig.channel = 'sample-channel';
    mediaConfig.debugLogging = true;
    mediaConfig.ssl = true;
    mediaConfig.appVersion = 'v1.0.0';
    
    ADB.core.extend(YoutubeDelegate.prototype, MediaHeartbeatDelegate.prototype);
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

        tracker = new MediaHeartbeat(new YoutubeDelegate(player), mediaConfig, appMeasurement);

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