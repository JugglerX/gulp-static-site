module.exports.register = function (handlebars, options) {
  handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
  });
};




