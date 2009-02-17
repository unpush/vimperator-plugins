var PLUGIN_INFO =
<VimperatorPlugin>
    <name>{NAME}</name>
    <description>add "Yank element's text/html/attrs" or "Paste to element" hint mode</description>
    <minVersion>2.0</minVersion>
    <maxVersion>2.0</maxVersion>
    <updateURL>http://svn.coderepos.org/share/lang/javascript/vimperator-plugins/trunk/hints-copy.js</updateURL>
    <author mail="hotchpotch@gmail.com" homepage="http://d.hatena.ne.jp/secondlife/">Yuichi Tateno</author>
    <license>MPL 1.1/GPL 2.0/LGPL 2.1</license>
    <version>0.1</version>
    <detail><![CDATA[
; の hint モードで、c/C で要素の text / html / attributes をクリップボードにコピー(Yank)できるようにするプラグインです。
ソースコードや段落, 画像のURL, input/textarea の値などをさくっとコピーしたり、どこかの部分の html 自体をコピりたいなー、という時に活用できます。
また p/P で、input/textarea の要素に、現在のクリップボードの値を貼り付け(pが追加、Pが置換)することができます。エディタで書いた文章をそのまんま追加したい時などに利用できます。

== SETTINGS 
マップするキーや hint の xpath などは変更できます。

liberator.globalVariables.hints_copy_maps = ['c', 'C', 'p', 'P'];

例: paste のほうは設定しない
liberator.globalVariables.hints_copy_maps = ['c', 'C', null, null];

set hintyanktags='//xpath|//xpath2'; 
set hintpastetags='//xpath|//xpath2'; 

== MAPPING ==
;c :
    Yank hint element's text or attributes.
;C :
    Yank hint element's html.
;p :
    Paste(append) to input/textarea.
;P :
    Paste(replace) to input/textarea.

]]></detail>
</VimperatorPlugin>;

(function() {
var p = function(msg) {
  liberator.log(msg, 0);
};

const DEFAULT_MAPS = ['c', 'C', 'p', 'P'];
const DEFAULT_YANK_HINTTAGS = 'h1 h2 h3 h4 h5 h6 pre p ul ol blockquote img code input textarea'.
    split(/\s+/).map(function(t) '//' + t).join(' | ');
const TEXT_ATTRS = 'src value href title alt'.split(/\s+/);

const DEFAULT_PASTE_HINTTAGS = '//input[@type="text" or @type="password" or @type="search" or not(@type)] | //textarea';

options.add(["hintyanktags"],
    "XPath string of hintable elements activated by 'hints-yank'",
    "string", DEFAULT_YANK_HINTTAGS);

options.add(["hintpastetags"],
    "XPath string of hintable elements activated by 'hints-paste'",
    "string", DEFAULT_PASTE_HINTTAGS);

let maps = liberator.globalVariables.hints_copy_maps || DEFAULT_MAPS;

var stripText = function(text) {
    text = text.replace(/(^\s+\r?\n)|(\s+$)/m, '');
    let matched = text.match(/(\r?\n)/mg);
    if (!matched || matched.length == 1) 
        text = text.replace(/^\s+/, '');
    return text;
}

if (maps[0]) // c
    hints.addMode(maps[0], 'Yank TEXT', function(elem) {
        let text = elem.textContent;
        if (!text)
            for (let i = 0;  i < TEXT_ATTRS.length; i++)
                if (text = elem[TEXT_ATTRS[i]]) break;
    
        util.copyToClipboard(stripText(text), true);
    }, function() options['hintyanktags']);

if (maps[1]) // C
    hints.addMode(maps[1], 'Yank HTML', function(elem) {
        elem = elem.cloneNode(true);
        let tmp = window.content.document.createElement('div');
        tmp.appendChild(elem);
        util.copyToClipboard(tmp.innerHTML, true);
    }, function() options['hintyanktags']);

var replaceOrAppend = function(replace) {
    return function(elem) {
        let clipboard = util.readFromClipboard();
        if (clipboard && clipboard.length) {
            if (elem.tagName == 'INPUT')
                clipboard.replace(/\r?\n/, ' ');

            if (replace) {
                elem.value = clipboard;
            } else {
                elem.value += clipboard;
            }
        }
    }
}

if (maps[2]) // p
    hints.addMode(maps[2], 'paste text (append)', replaceOrAppend(false), function() options['hintpastetags']);

if (maps[3]) // P
    hints.addMode(maps[3], 'paste text (replace)', replaceOrAppend(true), function() options['hintpastetags']);

})();

