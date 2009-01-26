var PLUGIN_INFO =
<VimperatorPlugin>
<name>{NAME}</name>
<description>enable to copy strings from a template (like CopyURL+)</description>
<description lang="ja">テンプレートから文字列のコピーを可能にします（CopyURL+みたいなもの）</description>
<minVersion>2.0</minVersion>
<maxVersion>2.0pre</maxVersion>
<updateURL>http://svn.coderepos.org/share/lang/javascript/vimperator-plugins/trunk/copy.js</updateURL>
<author mail="teramako@gmail.com" homepage="http://vimperator.g.hatena.ne.jp/teramako/">teramako</author>
<license>MPL 1.1/GPL 2.0/LGPL 2.1</license>
<version>0.6</version>
<detail><![CDATA[
== Command ==
:copy {copyString}:
    copy the argument replaced some certain string
:copy! {expr}:
    evaluate the argument and copy the result

=== Example ===
:copy %TITLE%:
    copied the title of the current page
:copy title:
    some as `:copy %TITLE%' by default
:copy! liberator.version:
    copy the value of `liberator.version'

== Keyword ==
%TITLE%:
    to the title of the current page
%URL%:
    to the URL of the current page
%SEL%:
    to the string of selection
%HTMLSEL%:
    to the html string of selection

== How to create template ==
you can set your own template using inline JavaScript.
>||
javascript <<EOM
liberator.globalVariables.copy_templates = [
  { label: 'titleAndURL',    value: '%TITLE%\n%URL%' },
  { label: 'title',          value: '%TITLE%', map: ',y' },
  { label: 'anchor',         value: '<a href="%URL%">%TITLE%</a>' },
  { label: 'selanchor',      value: '<a href="%URL%" title="%TITLE%">%SEL%</a>' },
  { label: 'htmlblockquote', value: '<blockquote cite="%URL%" title="%TITLE%">%HTMLSEL%</blockquote>' }
  { label: 'ASIN',   value: 'copy ASIN code from Amazon', custom: function(){return content.document.getElementById('ASIN').value;} },
];
EOM
||<
label:
    template name which is command argument
value:
    copy string
    the certain string is replace to ...
map:
    key map (optional)
custom:
    {function} or {Array} (optional)
    {function}:
        execute the function and copy return value, if specified.
    {Array}:
        replaced to the {value} by normal way at first.
        then replace words matched {Array}[0] in the replaced string to {Array}[1].
        {Array}[0]:
            String or RegExp
        {Array}[1]:
            String or Function
        see http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:String:replace

== Options ==
>||
liberator.globalVariables.copy_use_wedata = false; // false by default
||<
true に設定すると wedata からテンプレートを読込みます。
>||
liberator.globalVariables.copy_wedata_include_custom = true; // false by default
||<
custom が設定された wedata を読込みます。
SandBox でなく、window.eval を利用してオブジェクトする為、
セキュリティ上の理由で初期設定は false になっています。
true に設定する場合は、動作を理解したうえ自己責任でご利用ください。
>||
liberator.globalVariables.copy_wedata_exclude_labels = [
    'pathtraqnormalize',
];
||<
wedata から読込まない label のリストを定義します。
]]></detail>
</VimperatorPlugin>;

liberator.plugins.exCopy = (function(){
var excludeLabelsMap = {};
liberator.globalVariables.copy_templates = null;
if (!liberator.globalVariables.copy_templates){
    liberator.globalVariables.copy_templates = [
        { label: 'titleAndURL',    value: '%TITLE%\n%URL%' },
        { label: 'title',          value: '%TITLE%' },
        { label: 'anchor',         value: '<a href="%URL%">%TITLE%</a>' },
        { label: 'selanchor',      value: '<a href="%URL%" title="%TITLE%">%SEL%</a>' },
        { label: 'htmlblockquote', value: '<blockquote cite="%URL%" title="%TITLE%">%HTMLSEL%</blockquote>' }
    ];
}

liberator.globalVariables.copy_templates.forEach(function(template){
    if (typeof template.map == 'string')
        addUserMap(template.label, [template.map]);
    else if (template.map instanceof Array)
        addUserMap(template.label, template.map);
});

// used when argument is none
//const defaultValue = templates[0].label;
commands.addUserCommand(['copy'],'Copy to clipboard',
    function(args){
        liberator.plugins.exCopy.copy(args.string, args.bang);
    },{
        completer: function(context, args){
            if (args.bang){
                completion.javascript(context);
                return;
            }
            context.title = ['Template','Value'];
            var templates = liberator.globalVariables.copy_templates.map(function(template)
                [template.label, liberator.modules.util.escapeString(template.value, '"')]
            );
            if (!context.filter){ context.completions = templates; return; }
            var candidates = [];
            var filter = context.filter.toLowerCase();
            context.completions = templates.filter(function(template) template[0].toLowerCase().indexOf(filter) == 0);
        },
        bang: true
    }
);

function addUserMap(label, map){
    mappings.addUserMap([modes.NORMAL,modes.VISUAL], map,
        label,
        function(){ liberator.plugins.exCopy.copy(label); },
        { rhs: label }
    );
}
function getCopyTemplate(label){
    var ret = null;
    liberator.globalVariables.copy_templates.some(function(template)
        template.label == label ? (ret = template) && true : false);
    return ret;
}
function replaceVariable(str){
    if (!str) return '';
    var win = new XPCNativeWrapper(window.content.window);
    var sel = '', htmlsel = '';
    var selection =  win.getSelection();
    function replacer(value){ //{{{
        switch(value){
            case '%TITLE%':
                return buffer.title;
            case '%URL%':
                return buffer.URL;
            case '%SEL%':
                if (sel)
                    return sel;
                else if (selection.rangeCount < 1)
                    return '';

                for (var i=0, c=selection.rangeCount; i<c; i++){
                    sel += selection.getRangeAt(i).toString();
                }
                return sel;
            case '%HTMLSEL%':
                if (htmlsel)
                    return sel;
                else if (selection.rangeCount < 1)
                    return '';

                var serializer = new XMLSerializer();
                for (var i=0, c=selection.rangeCount; i<c; i++){
                    htmlsel += serializer.serializeToString(selection.getRangeAt(i).cloneContents());
                }
                return htmlsel;
        }
        return '';
    } //}}}
    return str.replace(/%(TITLE|URL|SEL|HTMLSEL)%/g, replacer);
}

function wedataRegister(item){
    var libly = liberator.plugins.libly;
    var logger = libly.$U.getLogger("copy");
    item = item.data;
    if (excludeLabelsMap[item.label]) return;

    if (item.custom && item.custom.toLowerCase().indexOf('function') != -1) {
        if (!liberator.globalVariables.copy_wedata_include_custom ||
             item.label == 'test') {
            logger.log('skip: ' + item.label);
            return;
        }

        let custom = (function(item){

            return function(value){
                var STORE_KEY = 'plugins-copy-ok-func';
                var store = storage.newMap(STORE_KEY, true);
                var check = store.get(item.label);
                var ans;

                if (!check){
                    ans = window.confirm(
                        'warnning!!!: execute "' + item.label + '" ok ?\n' +
                        '(this function is working with unsafe sandbox.)\n\n' +
                        '----- execute code -----\n\n' +
                        'value: ' + item.value + '\n' +
                        'function: ' +
                        item.custom
                    );
                } else {
                    if (item.value == check.value &&
                        item.custom == check.custom &&
                        item.map == check.map){
                        ans = true;
                    } else {
                        ans = window.confirm(
                            'warnning!!!: "' + item.label + '" was changed when you registered the function.\n' +
                            '(this function is working with unsafe sandbox.)\n\n' +
                            '----- execute code -----\n\n' +
                            'value: ' + item.value + '\n' +
                            'function: ' +
                            item.custom
                        );
                    }
                }

                if (!ans) return;
                store.set(item.label, item);
                store.save();

                var func;
                try{
                    func = window.eval('(' + item.custom + ')');
                } catch (e){
                    logger.echoerr(e);
                    logger.log(item.custom);
                    return;
                }
                return func(value);
            };
        })(item);

        exCopyManager.add(item.label, item.value, custom, item.map);
    } else {
        exCopyManager.add(item.label, item.value, null, item.map);
    }
}
var exCopyManager = {
    add: function(label, value, custom, map){
        var template = {label: label, value: value, custom: custom, map: map};
        liberator.globalVariables.copy_templates.unshift(template);
        if (map) addUserMap(label, map);

        return template;
    },
    get: function(label){
        return getCopyTemplate(label);
    },
    copy: function(arg, special){
        var copyString = '';
        var isError = false;
        if (special && arg){
            try {
                copyString = liberator.eval(arg);
                switch (typeof copyString){
                    case 'object':
                        copyString = copyString === null ? 'null' : copyString.toSource();
                        break;
                    case 'function':
                        copyString = copyString.toString();
                        break;
                    case 'number':
                    case 'boolean':
                        copyString = '' + copyString;
                        break;
                    case 'undefined':
                        copyString = 'undefined';
                        break;
                }
            } catch (e){
                isError = true;
                copyString = e.toString();
            }
        } else {
            if (!arg) arg = liberator.globalVariables.copy_templates[0];
            var template = getCopyTemplate(arg) || {value: arg};
            if (typeof template.custom == 'function'){
                copyString = template.custom.call(this, template.value);
            } else if (template.custom instanceof Array){
                copyString = replaceVariable(template.value).replace(template.custom[0], template.custom[1]);
            } else {
                copyString = replaceVariable(template.value);
            }
        }
        util.copyToClipboard(copyString || '');
        if (isError){
            liberator.echoerr('CopiedErrorString: `' + copyString + "'");
        } else {
            liberator.echo('CopiedString: `' + util.escapeHTML(copyString || '') + "'");
        }
    }
};

if (liberator.globalVariables.copy_use_wedata){
    function loadWedata(){
        if (!liberator.plugins.libly){
            liberator.echomsg("need a _libly.js when use wedata.");
            return;
        }

        var libly = liberator.plugins.libly;
        liberator.globalVariables.copy_templates.forEach(function(item) excludeLabelsMap[item.label] = item.value);
        if (liberator.globalVariables.copy_wedata_exclude_labels)
            liberator.globalVariables.copy_wedata_exclude_labels.forEach(function(item) excludeLabelsMap[item] = 1);
        var wedata = new libly.Wedata("vimp%20copy");
        wedata.getItems(24 * 60 * 60 * 1000, wedataRegister);
    }
    loadWedata();
}

return exCopyManager;
})();

// vim: set fdm=marker sw=4 ts=4 et:

