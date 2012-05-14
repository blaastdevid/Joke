var _ = require('common/util');
var TextView = require('ui').TextView;
var ImageView = require('ui').ImageView;
var db = require('../lib/db').DB;

_.extend(exports, {
	':load': function() {
		var self = this;
		var title = new ImageView();
		title.src(app.resourceURL('ketawacom_logo.png'));
		self.add(title);
		app.on('message', function(action, param){
			if(action === 'getMenu'){
				clearInterval(self.intervalId);
				delete self.intervalId;
				self.clear();
				var i = 1;
				var title = new ImageView();
				title.src(app.resourceURL('ketawacom_logo.png'));
				self.add(title);
				param.menus.forEach(function(item){
					var temp;
					if (i % 2 === 0) {
						temp = new TextView({
							label: item.title,
							style: {
								color: 'black',
								width: 'fill-parent',
								'background-color': 'transparent'
							}
						});
						temp.on('blur', function(){
							this.style({
								'color': 'black',
								'background-color': 'transparent',
								'font-weight': 'normal'
							});
						});
					} else {
						temp = new TextView({
							label: item.title,
							style: {
								color: 'black',
								width: 'fill-parent',
								'background-color': '#009eff'
							}
						});
						temp.on('blur', function(){
							this.style({
								'color': 'black',
								'background-color': '#009eff',
								'font-weight': 'normal'
							});
						});
					}
					temp.on('activate', function(){
						app.pushView('detail', {url: item.url, title: item.title});
					});
					temp.on('focus', function(){
						this.style({
							'color': 'black',
							'background-color': '#3682b0',
							'font-weight': 'bold'
						});
					});
					self.add(item.url, temp);
					i++;
				});
				self.focusItem(1);
			}
		});
	},
	':state': function(param) {
		var self = this;
		self.clear();
		self.scrollTop(0);
		var title = new ImageView();
		title.src(app.resourceURL('ketawacom_logo.png'));
		
		var wait = new TextView({
			"label": "Silahkan Tunggu",
			"style": {
				"border": "5 0 0 0"
			}
		});
		self.add(title);
		self.add('wait', wait);
		self.intervalId = setInterval(function() {
			if(self.id === undefined){
				self.id = 1;
			}else if(self.id < 10){
				self.id++;
			}else {
				self.id = 1;
			}
			var temp = '';
			for(var i = 0; i < self.id; i++){
				temp = temp + '.';
			}
			
			self.get('wait').label('Silahkan Tunggu' + temp);	
		}, 500);
		app.msg('getMenu', {action:'getMenu', url: param.url});
	},
	
	':inactive': function() {
		console.log('remove timer');
		var self = this;
		clearInterval(self.intervalId);
		delete self.intervalId;
	},
	
	':keypress': function(key) {
		console.log(key);
		if (this.index === undefined) {
			if (this.size() > 0) {
				this.focusItem(1);
			}
		} else if (key === 'up' || key === 'down') {
			var next = this.index + (key === 'up' ? -1 : 1);

			if (next < 1) {
				next = 1;
			} else if (next > (this.size()-1)) {
				next = this.size()-1;
			}

			if (this.index === next) {
				return;
			}

			this.focusItem(next);
		} else if (key === 'fire') {
			this.get(this.index).emit('activate');
		} else if(key === 'back'){
			console.log('back');
		}
	},
	
	focusItem: function(index) {
		if (this.index !== undefined) {
			this.get(this.index).emit('blur');
		}
		this.index = index;
		this.get(index).emit('focus');
		if(index === 1){
			this.scrollTop(0);
		}
		console.log(index);
		this.scrollTo(index);
	}
});
