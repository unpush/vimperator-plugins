/*
 * ==VimperatorPlugin==
 * @name toggler
 * @version 0.1
 * @author teramako <teramako at gmail.com>
 * ==/VimperatorPlugin==
 *
 * �������������򥯥륯���ѹ��������ͤ�
 * 
 * �ޤ����ǽ�˰ʲ�����褦��.vimperatorrc���������
js <<EOM
liberator.globalVariables.toggler = [
  ["name",[ setting commands ]],
  ["go",["set go=","set go=m","set go=b"]],
  ["sb",["sbclose","sbar Console"]]
  ["go_and_sb", [["set go=","sbclose"],["set go=mTb","sbar Console"]]]
  ...
];
EOM
 * 
 * ����
 * :toggle go
 * �ȥ��ޥ�ɤ�¹Ԥ����setting commands����μ���¹Ԥ���
 * �Ǹ�ޤǤ����Ⱥǽ�����
 * �Ĥޤꡢ�ǽ�� :toggle go �򤹤�� set go=m ���¹Ԥ����
 * �⤦���ټ¹Ԥ���ȡ�set go=b ���¹Ԥ����
 * �⤦���٤���ȡ��ǽ����äơ�set go= ���¹Ԥ����
 *
 * :map <F2> :toggle go<CR>
 * �ʤɤȤ�äƤ����ȥܥ����Ĥǥ��륯���ؤ��
 */
liberator.plugins.toggler = (function(){

var settings = {};
function Toggler(name, cmds){
	if (!cmds || cmds.length < 2) throw new Error("arguments are not enough");
	this.name = name;
	this.cmds = cmds;
	this.index = 0;
}
Toggler.prototype = {
	next: function(notUpdate){
		let index = this.index + 1;
		if (index >= this.cmds.length) index = 0;
		if (!notUpdate) this.index = index;
		return this.cmds[index];
	},
	previous: function(notUpdate){
		let index = this.index - 1;
		if (index < 0) index = this.cmds.length -1;
		if (!notUpdate) this.index = index;
		return this.cmds[this.index];
	},
	list: function(){
		var data = [];
		for (var i = 0; i<this.cmds.length; i++){
			data.push([i==this.index ? "*":"", this.cmds[i]]);
		}
		liberator.echo(template.table(this.name, data), true);
	}
};
var manager = {
	add: function(name, cmds){
		if (name in settings){
			liberator.echoerr(name + " is already exists");
			return;
		}
		settings[name] = new Toggler(name, cmds);
	},
	get: function(name){
		if (name in settings){
			return settings[name];
		}
		liberator.echoerr(name + " is not exists");
		return false;
	},
	toggle: function(name, isPrevious){
		let toggler = this.get(name);
		if (!toggler) return;
		let cmd = isPrevious ? toggler.previous() : toggler.next();
		if (cmd instanceof Array){
			cmd.forEach(function(str){
				liberator.execute(str);
			});
		} else if (typeof cmd == "function"){
			cmd();
		} else {
			liberator.execute(cmd);
		}
	},
	list: function(name){
		if (name && (name in settings)){
			settings[name].list();
			return;
		}
		for (let i in settings){
			settings[i].list();
		}
	}
};

commands.addUserCommand(['toggle'],'setting toggler',
	function(args){
		if (args["-list"] || args.length == 0){
			if (args.length == 0)
				liberator.plugins.toggler.list();
			else
				args.forEach(function(name) liberator.plugins.toggler.list(name));
			return;
		}
		args.forEach(function(name){
			liberator.plugins.toggler.toggle(name, args.bang);
		});
	},{
		argCount: "*",
		bang: true,
		options: [
			[["-list","-l"], commands.OPTION_NOARG]
		],
		completer: function(context,args){
			let filter = context.filter.split(/\s+/).pop();
			let reg = new RegExp(filter ? "^" + flter : ".*", "i");
			context.title= ["Name", args.bang ? "Previous" : "Next"];
			let list = [];
			for (let i in settings){
				let toggler = settings[i];
				if (reg.test(i) && !args.some(function(arg) arg==i))
					list.push([i, args.bang ? toggler.previous(true) : toggler.next(true)]);
			}
			context.completions = list;
		}
	},
	true);

if (liberator.globalVariables.toggler){
	liberator.globalVariables.toggler.forEach(function(toggler){
		manager.add(toggler[0], toggler[1]);
	});
}
return manager;
})();

