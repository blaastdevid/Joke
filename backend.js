var jsdom = require('jsdom');
var ReqLog  = require('blaast/mark').RequestLogger;
var Scaling = require('blaast/scaling').Scaling;
var _  = require('underscore');
var rlog = new ReqLog(app.log);
var scaling = new Scaling(app.config);

function JokeAPI(){
}

JokeAPI.prototype = {
    request: function(url, cb){
        var r = rlog.start(url);
        jsdom.env(url,
            [
                'http://code.jquery.com/jquery-1.5.min.js'
            ],
            function(errors, window) {
                r.done();
                cb(window);
            }
        );
    },
    parseMenu: function(window, cb){
        var data = [];
        window.$('ul.listdata').find('li').each(function(i){
            data.push({title: window.$(this).text(), url: window.$(this).find('a').attr('href')});
        });
        window.close();
        cb(data);
    },
    parseContent: function(window, cb) {
        var story = window.$('.story').text();
        window.close();
        cb(story);
    },
    menuRequest: function(url, cb) {
        var self = this;
        self.request(url, function(window){
            self.parseMenu(window, cb);
        });
    },
    contentRequest: function(url, cb) {
        var self = this;
        self.request(url, function(window){
            self.parseContent(window, cb);
        });
    }
};

function JokeUser(client, api){
    this.client = client;
    this.api = api;
}

JokeUser.prototype = {
    getMenu: function(args){
        var self = this;
        this.api.menuRequest(args.url, function(menus){
            self.client.msg(args.action, {menus: menus});
        });
    },
    getContent: function(args){
        var self = this;
        this.api.contentRequest(args.url, function(content){
            self.client.msg(args.action, {content: content, title: args.title});
        });
    }
};

app.message(function(client, action, param){
   var self = this;
   if (action.length > 0 && JokeUser.prototype.hasOwnProperty(action)) {
        app.debug(client.header() + ' action="' + action + '"');
        var user = new JokeUser(client, new JokeAPI());
        user[action].apply(user, [param]);
    } else {
        app.debug(client.header() + ' unknown-action="' + action + '"');
    }
});

app.setResourceHandler(function(request, response) {
    var r = rlog.start(request.id);

    function sendReply(response, error, imageType, data) {
        if (error) {
            r.error(error);
            response.failed();
        } else {
            r.done();
            response.reply(imageType, data);
        }
    }
    
    scaling.scale(request.id, request.display_width, request.display_height, 'image/jpeg',
        function(err, data) {
            sendReply(response, err, 'image/jpeg', data);
        }
    );
});