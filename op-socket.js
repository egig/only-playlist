module.exports = function(io, app) {


  io.on('connection', function(socket){

    console.log('a user connected: ', socket.id);

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });

    socket.on('track.played', function(video_id, index){
       io.emit('track.played', video_id, index);
    });

    socket.on('track.added', function(video_id, title, thumbnail, playlist_id){
      //insert track here
      var pM = app.model(app._ROOT+'/lib/playlist');
      pM.insertTrack(playlist_id, video_id, title, thumbnail).then(function(){
        io.emit('track.added', video_id, title, thumbnail, playlist_id);
      });
    });

    socket.on('playlist.new', function(plname){

      model.addPlaylist(plname, function(){
        io.emit('playlist.new', plname);
      });
    });

    socket.on('track.delete', function(pltrackid, selector){

      model.deletePlaylistTrack(pltrackid, function(){
        io.emit('track.delete', pltrackid, selector);
      });
    });

    socket.on('playlist.changed', function(plid){
       io.emit('playlist.changed', plid);
    });

    socket.on('volume.updated', function(v){
       io.emit('volume.updated', v);
    });

    socket.on('playlist.deleted', function(plid){

      model.deletePlaylist(plid, function(err, plidx){

        if(err) {
          return console.log(err);
        }

        io.emit('playlist.deleted', plidx);
      });
    });

    socket.on('playlist.sorted', function(ids){
      model.sortPlaylistTrack(ids, function(err) {
        if(err) {
          return console.log(err);
        }

          io.emit('playlist.sorted', ids);
      })
    });

  });

 return {}
}
