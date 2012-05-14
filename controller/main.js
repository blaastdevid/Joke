var _ = require('common/util');
var TextView = require('ui').TextView;
var ImageView = require('ui').ImageView;
var db = require('../lib/db').DB;

_.extend(exports, {
	':load': function() {
		var self = this;
		self.clear();
		var title = new ImageView();
		title.src(app.resourceURL('ketawacom_logo.png'));
		self.add(title);
		var i = 1;
		db.forEach(function(item){
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
				app.pushView('list', {url: item.url, title: item.title});
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
	},
	
	':keypress': function(key) {
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
