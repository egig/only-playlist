var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var model = require('./model.js');
var nunjucks = require('nunjucks');

var config = JSON.parse(fs.readFileSync(__dirname+"/config.json", 'utf8'));

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

app.use(express.static('public'));

app.get('/', function(req, res){

  fs.stat(__dirname+"/storage/playlist.txt", function(err, stat) {
    if(err == null) {
        console.log('File exists');
        fs.unlink(__dirname+"/storage/playlist.txt");
    } else if(err.code == 'ENOENT') {
        // fs.writeFile('log.txt', 'Some log\n');
        return;
    } else {
        console.log('Some other error: ', err.code);
    }
});

    res.sendFile(__dirname + '/index.html');
});

app.get('/slave', function(req, res){
  res.sendFile(__dirname + '/slave.html');
});

app.get('/player/:playlist_id?', function(req, res){

  var playlist_id = req.params.playlist_id || 1;

  model.get_playlist_tracks(playlist_id, function(playlists, plid, tracks){

    var data = {
      api_key: config.googleApiKey,
      playlists: playlists,
      tracks: tracks,
      playlist_id: plid
    }

    res.render('player.html', data);
  });
});

app.get('/playlist/:playlist_id?', function(req, res){

  var playlist_id = req.params.playlist_id || 1;

  model.get_playlist_tracks(playlist_id, function(playlists, plid, tracks){

    var data = {
      api_key: config.googleApiKey,
      playlists: playlists,
      tracks: tracks,
      playlist_id: plid
    }

    res.render('playlist.html', data);
  });
});

app.get("/init-playlist.html", function(req, res) {

  fs.readFile(__dirname + "/storage/playlist.txt", 'utf8', function (err,data) {
    if (err) {
      console.log(err);
      return false;
    }

    res.end(data);
  });
});

io.on('connection', function(socket){

  console.log('a user connected: ', socket.id);

  socket.on('disconnect', function(){
      console.log('user disconnected');
  });

  socket.on('playlist.updated', function(t){
     io.emit('playlist.updated', t);

    // save playlist
    fs.appendFile(__dirname + "/storage/playlist.txt", t+"\r\n", function(err) {
          if(err) {
              return console.log(err);
          }
          console.log("The file was saved!");
      });
  });

  socket.on('ytplaylist.updated', function(vid, plid){
     model.insert_track(plid, vid.snippet.title, vid.snippet.thumbnails.medium.url, vid.id, io);

     //io.emit('ytplaylist.updated.success', vid, plid);
  });

  socket.on('track.played', function(link, host){
     io.emit('track.played', link, host);
  });

  socket.on('yttrack.played', function(vid, index){
     io.emit('yttrack.played', vid, index);
  });

  socket.on('new-playlist', function(plname){

    model.add_playlist(plname, function(){
      io.emit('new-playlist', plname);
    });
  });

  socket.on('delete-track', function(pltrackid){

    model.delete_pltrack(pltrackid, function(){
      io.emit('delete-track-success', pltrackid);
    });
  });

  socket.on('playlist-changed', function(plid){
     io.emit('playlist-changed', plid);
  });

  socket.on('volume-updated', function(v){
     io.emit('volume-updated', v);
  });

  socket.on('playlist-deleted', function(plid){

    model.deletePlaylist(plid, function(err, plidx){

      if(err) {
        return console.log(err);
      }

      io.emit('playlist-deleted', plidx);
    });
  });

  socket.on('playlist-sorted', function(ids){
    model.sortPlaylistTrack(ids, function(err) {
      if(err) {
        return console.log(err);
      }

        io.emit('playlist-sorted', ids);
    })
  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
