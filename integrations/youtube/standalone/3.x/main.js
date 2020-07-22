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

    var Media = ADB.Media;
    var MediaConfig = ADB.MediaConfig;

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
    var mediaConfig = new MediaConfig();
    mediaConfig.trackingServer = 'obumobile5.hb-api.omtrdc.net';
    mediaConfig.playerName = 'youtube-sample-player';
    mediaConfig.channel = 'sample-channel';
    mediaConfig.appVersion = 'v1.0.0';
    mediaConfig.ssl = true;
    mediaConfig.debugLogging = true;

    Media.configure(mediaConfig, appMeasurement);

    var player;
    var playheadListener;
    var tracker = Media.getInstance();
    var isTracking = false;

    function startSessionIfNecessary() {
        if (isTracking) {
            return;
        }

        var videoInfo = player.getVideoData();

        var name = !!videoInfo.title ? videoInfo.title : "unknown";
        var mediaInfo = Media.createMediaObject(name, videoInfo.video_id, player.getDuration(), Media.StreamType.VOD, Media.MediaType.Video);
        var metadata = {};
        // Standard metadata
        metadata[Media.VideoMetadataKeys.Show] = "show";
        // Custom metadata
        metadata["author"] = "author";
        tracker.trackSessionStart(mediaInfo, metadata);

        playheadListener = setInterval(function () {            
            tracker.updatePlayhead(player.getCurrentTime());            
        }, 500);

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
        
        clearInterval(playheadListener);        
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
            tracker.trackEvent(Media.Event.BufferStart);
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