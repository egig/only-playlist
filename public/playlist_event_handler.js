window.PLAYLIST_EVENT_HANDLER = (function($, socket) {

  function get_vid(url) {
    var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match && match[2].length == 11) {
      return match[2];
    } else {
      //error
    }
  }

  // 3. This function creates an <iframe> (and YouTube player)
  //    after the API code downloads.

  return {

    init:function(apiKey, playlistId, playlistDeletable) {

      this.listenDeleteTrack();
      this.listenAddPlaylist();
      this.listenSocketEvents();
      this.listenAddTrack(apiKey, playlistId);
      this.listenTrackPlayed();
      this.listenChangePlaylist();
      this.listenDeletePlaylist(playlistDeletable);
      this.initVolumeControl();
      this.initSorting();

    },

    initSorting() {
        $(function() {
          $( "#playlist" ).sortable({
            placeholder: "ui-state-highlight",
            update: function( event, ui ) {
                // @todo save to database
                var lis = $( "#playlist" ).find("li.media");

                var ids = [];
                for(var i=0; i<lis.length; i++ ) {
                  var id = $(lis[i]).attr('id').substr(6);
                  ids.push(id);
                }

                socket.emit("playlist-sorted", ids);
            }
          });
          $( "#playlist" ).disableSelection();
        });
    },

    initVolumeControl: function() {
      var vControl = $(volume_control).slider({
          min: 0,
          max: 100,
         change: function( event, ui ) {
              socket.emit("volume-updated", ui.value);
          }
      });
    },

    listenChangePlaylist: function() {
      $(document).on("click", 'a.playlist-item', function(e){
        e.preventDefault();
        var plid  = $(this).data('plid');
        socket.emit("playlist-changed", plid);
      });
    },

    listenDeleteTrack: function() {
      $(document).on("click", '.delete-track', function(e){
        var pltrackid = $(this).data("pltrack-id");
        var deleteTrack = "li#track-"+pltrackid;
        socket.emit("delete-track", deleteTrack);
      });
    },

    listenAddPlaylist: function() {

      $(add_playlist_form).on("submit", function(e) {
        e.preventDefault();
         var plname = add_playlist_form.playlist_name.value;
         socket.emit("new-playlist", plname);
       });

    },

    listenSocketEvents: function() {
      socket.on('new-playlist', function(plname) {
          window.location.reload(true);
      });

      socket.on('delete-track', function(plname) {
        
      });

      socket.on('playlist-changed', function(plid) {
          window.location.replace(plid);
      });

      socket.on('playlist-deleted', function(plid) {
          window.location.replace(1);
      });

      socket.on('delete-track-success', function(trackid) {
          $(trackid).slideUp();
      });

      socket.on('yttrack.played', function(video_id, index){

        var li = $("li.media").eq(index);
        li.siblings().removeClass('playing');
        li.addClass('playing');
      });

      socket.on('ytplaylist.updated.success', function(title, thumbnail_url, trackid) {
          var html = '<li class="media" id="track-'+trackid+'">' +
      '<div class="media-left">'+
        '<a href="#">'+
          '<img height="40px"  class="media-object" src="'+thumbnail_url+'">'+
        '</a>'+
      '</div>'+
      '<div class="media-body">'+
        '<h4 class="media-heading"><a class="track" data-id="'+title+'" href="javascript:;">'+title+'</a></h4>'+
         '<button class="btn btn-xs btn-default delete-track" data-pltrack-id="'+trackid+'" >Delete</button>'+
      '</div>'+
    '</li>';
          $(playlist).append(html);
      });

      socket.on('playlist-sorted', function(ids) {
          window.location.reload(true);
      });
    },

    listenAddTrack: function(apiKey, playlistId) {
      $(add_track_form).on('submit', function(e) {
        e.preventDefault();
        var url = $(yt_url).val();
        var video_id = get_vid(url);

        $.getJSON("https://www.googleapis.com/youtube/v3/videos?part=snippet&id="+video_id+"&key="+apiKey,
        function(data){
          socket.emit('ytplaylist.updated', data.items[0], playlistId);
        });
      });
    },

    listenTrackPlayed: function() {
      $(document).on('click', 'a.track', function(e) {
        e.preventDefault();

        var li = $(this).parents('li.media');

        var index = li.index();
        var video_id = $(this).data('id');
        socket.emit('yttrack.played', video_id, index);
      });
    },

    listenDeletePlaylist: function(playlistDeletable) {

      if(playlistDeletable) {
        $(document).on("click", "#delete_playlist", function(e){
          var plid = $(this).data("pl-id");
          socket.emit("playlist-deleted", plid);
        });
      }
    },
  }

})(jQuery, socket);
