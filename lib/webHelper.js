'use strict';
const nodeSpotifyWebHelper = require('node-spotify-webhelper');
const spotify = new nodeSpotifyWebHelper.SpotifyWebHelper();

spotify.getStatus(function(err,res){
  if(err) return console.log(err);

  console.info('current playing:',
    res.track.artis_resource.name, '-',
    res.track.track_resource.name);
});
