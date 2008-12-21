var PLUGIN_INFO =
<VimperatorPlugin>
  <name>AppLauncher</name>
  <name lang='ja'>アプリケーションランチャー</name>
  <description>Launch defined application</description>
  <description lang='ja'>アプリケーションを起動します</description>
  <version>0.11</version>
  <author>pekepeke</author>
  <minVersion>2.0pre</minVersion>
  <maxVersion>2.0pre</maxVersion>
  <detail lang='ja'><![CDATA[
  == Commands ==
    :applaunch [name]
    :runapp [name]
      [name] で指定されたアプリケーションを起動します。
  == .vimperatorrc example ==
  js <<EOM
  liberator.globalVariables.applauncher_list = [
    [ 'name', 'application path', ['arguments','%URL%', '%SEL%']],
    [ 'Internet Explorer', 'C:\\Program Files\\Internet Explorer\\iexplore.exe', '%URL%'],
    [ 'Internet Explorer(Search)', 'C:\\Program Files\\Internet Explorer\\iexplore.exe', '%SEL%'],
  ];
  EOM
  %URL% は実行時に選択中のリンクURL、もしくは開いているページのURLに置き換えられます。
  %SEL% は選択中の文字列に置き換えられます。
  引数を複数指定する場合は配列形式で指定してください。
  ]]></detail>
</VimperatorPlugin>

liberator.plugins.AppLauncher = (function(){
  const AppName = 'AppLauncher';
  var global = liberator.globalVariables;
  var settings = global.applauncher_list ? global.applauncher_list : [];
  if (!settings || settings.length <= 0) return;
  var completer = settings.map( function([name, app, args]) [name, args ? app + ' ' + args.toString(): app] );

  var Class = function(){ return function(){ this.initialize.apply(this, arguments); }};
  var AppLauncher = new Class();

  AppLauncher.prototype = {
    initialize: function(){
      this.buildMenu();
      this.registerCommand();
    },
    registerCommand: function(){
      var self = this;
      commands.addUserCommand(['applaunch', 'runapp'], 'Run Defined Application',
        function(arg){
          arg = (typeof arg.string == undefined ? arg : arg.string);
          self.launch(arg);
        }, {
          completer: function( context, arg, special){
            let filter = context.filter;
            context.title = [ 'Name', 'Description'];
            if (!filter) {
              context.completions = completer;
              return;
            }
            filter = filter.toLowerCase();
            context.completions = completer.filter( function(el) el[0].toLowerCase().indexOf(filter) == 0);
          }
        });
    },
    buildMenu: function(){
      var self = this;
      var menu = document.createElement('menu');
      menu.setAttribute('id', AppName + 'Context');
      menu.setAttribute('label', AppName);
      menu.setAttribute('accesskey', 'L');

      var menupopup = document.createElement('menupopup');
      menupopup.setAttribute('id', AppName + 'ContextMenu');
      menu.appendChild(menupopup);
      for (let i=0, l=settings.length; i<l; i++){
        let [name, app, args] = settings[i];
        let menuitem = document.createElement('menuitem');
        menuitem.setAttribute('id', AppName + i);
        menuitem.setAttribute('label', name + '\u3092\u8D77\u52D5');
        menuitem.addEventListener('command', function() self.launch(name) , false);
        menupopup.appendChild(menuitem);
      }
      document.getElementById('contentAreaContextMenu').appendChild(menu);
    },
    variables: {
      __noSuchMethod__: function(name) name,
      URL: function() gContextMenu && gContextMenu.onLink ? gContextMenu.getLinkURL() : buffer.URL,
      SEL: function(){
        var selection = window.content.window.getSelection();
        var sel = '';
        for (let i=0, l=selection.rangeCount; i<l; i++) sel+=selection.getRangeAt(i).toString();
        return sel;
      },
      TITLE: function() buffer.title
    },
    launch: function(appName){
      var self = this;
      appName = appName.replace(/\\/g,'');                // fix commandline input ' ' -> '\ '
      settings.some( function([name, app, args]){
        args = args instanceof Array ? args : args ? [args] : [];
        args = args.map( function( val ) val.replace(/%([A-Z]+)%/g, function( _, name ) self.variables[name]()) );
        if (appName == name) {
          io.run(app, args);
          return true;
        }
        return false;
      });
    }
  }
  return new AppLauncher();
})();
