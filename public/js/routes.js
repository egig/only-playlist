var ROUTE_CONFIG = (function($) {

  return {
     init: function(router, nunjucks) {
       router.on({
           '/playlist/:id': function (param) {
             socket.emit('playlist.changed', param.id);
           },
       });

       router.resolve();
     }
  }
})(jQuery);
