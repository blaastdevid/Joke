var ReqLog  = require('blaast/mark').RequestLogger;
var Scaling = require('blaast/scaling').Scaling;
var _  = require('underscore');
var rlog = new ReqLog(app.log);
var scaling = new Scaling(app.config);
var storage = require('blaast/simple-data');
var http    = require('blaast/simple-http');
var cheerio = require("cheerio");

function JokeAPI() {
}

function DB() {
}

DB.prototype = {
    isExist: function(key, cb) {
        storage.get(key, function(err, data) { 
            if (data) {
                cb(true, data);
            } else {
                cb(false);
            }
        });
    },
    
    save: function(key, value) {
        storage.set(key, value,  function(err, oldData) {
            if (err) {
                log.info('set() result was err = ' + err);
            }
		});
    }
};

JokeAPI.prototype = {
    request: function(url, cb) {
        var r = rlog.start(url);
        http.get(url, {
            ok: function(data) {
                r.done();
                cb(cheerio.load(data));
            },
            error: function(err) {
                console.log('err: ' + err);
                cb(undefined);
                r.done();
            }
        });
    },
    parseMenu: function($, cb) {
        var data = [];
        if($) {
            $('ul.listdata').find('li').each(function(i) {
                data.push({title: $(this).text(), url: $(this).find('a').attr('href')});
            });
        }
        cb(data);
    },
    parseContent: function($, cb) {
        var story = ' ';
        if($) {
            story = $('.entry').text();
        }
        cb(story);
    },
    menuRequest: function(url, cb) {
        var self = this;
        self.request(url, function(window) {
            self.parseMenu(window, cb);
        });
    },
    contentRequest: function(url, cb) {
        var self = this;
        self.request(url, function(window) {
            self.parseContent(window, cb);
        });
    }
};

function JokeUser(client, api) {
    this.client = client;
    this.api = api;
    this.db = new DB();
}

JokeUser.prototype = {
    getMenu: function(args) {
        var self = this;
        this.api.menuRequest(args.url, function(menus) {
            self.client.msg(args.action, {menus: menus});
        });
    },
    getContent: function(args) {
        var self = this;
        this.db.isExist(args.title, function(exist, data) {
            if (exist) {
                self.client.msg(args.action, {content: data.content, title: args.title});
            } else {
                self.api.contentRequest(args.url, function(content) {
                    self.db.save(args.title, {content: content});
                    self.client.msg(args.action, {content: content, title: args.title});
                });
            }
        });
    }
};

app.message(function(client, action, param) {
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