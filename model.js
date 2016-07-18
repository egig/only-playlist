var fs = require('fs');
var config = JSON.parse(fs.readFileSync(__dirname+"/config.json", 'utf8'));

module.exports = {

  connection: null,
  create_connection: function() {
    var mysql      = require('mysql');
    this.connection = mysql.createConnection({
      host     : config.databaseHost,
      user     : config.databaseUser,
      password : config.databasePassword,
      database : config.databaseName
    });

    /*connection.connect();

    connection.query('SELECT * from track', function(err, rows, fields) {
      if (!err)
        console.log('The solution is: ', rows);
      else {
        console.log('Error while performing Query.');
        console.log(err);
      }
    });

    connection.end();
    */
  },

  sortPlaylistTrack: function(ids, callback) {

    this.create_connection();
    this.connection.connect();

    var curErr
    for(var i=0; i<ids.length;i++) {
      var q = "UPDATE playlist_track SET sequence="+i+" where id="+ids[i]+"; ";

      this.connection.query(q, function(err, result) {
        if(err) {
          curErr = err;
        }
      });
    }

    return callback(curErr);

    this.connection.end();

  } ,

  deletePlaylist: function(plid, callback) {
    this.create_connection();
    this.connection.connect();

    var _this = this;
    this.connection.query('DELETE from playlist_track where playlist_id =\''+plid+'\'', function(err, result) {
      _this.connection.query('DELETE from playlist where id =\''+plid+'\'', function(err, result) {

          _this.connection.end();

          return callback(err, plid);
      });

    });
  },

  delete_pltrack: function(pltrackid, callback) {

    this.create_connection();
    this.connection.connect();

    this.connection.query('DELETE from playlist_track where id =\''+pltrackid+'\'', function(err, result) {
        return callback(pltrackid);
    });

    this.connection.end();
  },

  add_playlist: function(plname, callback) {

    this.create_connection();
    this.connection.connect();

    var data = {
      name: plname
    };

    this.connection.query('INSERT INTO playlist SET ?', data, function(err, result) {
        return callback(plname);
    });

    this.connection.end();

  },

  get_playlist_tracks: function(plid, callback) {
    this.create_connection();
    this.connection.connect();

    var _this = this;
    this.connection.query('SELECT * from playlist', function(err, playlists, fields) {

      _this.connection.query('SELECT * from playlist where id=\''+plid+'\'', function(err, rows) {

        if(rows.length > 0) {
          var pl = rows[0];
          var query = "";
          query += "SELECT *, playlist_track.id as pltrackid FROM track JOIN playlist_track on track.id = playlist_track.track_id ";
          query += "where playlist_track.playlist_id = "+pl.id;
          query += " order by playlist_track.sequence ASC";

          _this.connection.query(query, function(err, tracks) {
            if(err) {
              return console.log(err);
            }

            callback(playlists, pl.id, tracks);
          });
        } else {
           var tracks = [];
           callback(playlists, 2, tracks);
        }

      });
    });

    //this.connection.end();
  },

  insert_track: function(playlist_id, title, thumbnail_url, video_id, io) {

    this.create_connection();
    this.connection.connect()

    var data = {
      title: title,
      thumbnail_url: thumbnail_url,
      video_id: video_id
    };

    var _this = this;
    var track_id = "";
    this.connection.query("SELECT * FROM track where video_id = '"+video_id+"'", function(err, results) {

        if(results.length == 0) {
          _this.connection.query('INSERT INTO track SET ?', data, function(err, result) {

            track_id = result.insertId;

            var data2 = {
              playlist_id: playlist_id,
              track_id: track_id,
            }
            _this.connection.query('INSERT INTO playlist_track SET ?', data2, function(err, resultPL){
              io.emit('ytplaylist.updated.success', title, thumbnail_url, resultPL.insertId);
            });

        });
      } else {

        track_id = results[0].id;

        var data2 = {
          playlist_id: playlist_id,
          track_id: track_id,
        }

        _this.connection.query(" INSERT INTO playlist_track SET ?", data2, function(err, resultPL){
          io.emit('ytplaylist.updated.success', title, thumbnail_url, resultPL.insertId);
         });
      }
    });

    // @todo
    // this.connection.end();
  }
}
