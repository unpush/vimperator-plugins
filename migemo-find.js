var PLUGIN_INFO =
<VimperatorPlugin>
<name>{NAME}</name>
<description>Replace default search to migemo.</description>
<description lang="ja">ɸ��θ����� XUL/Migemo ���֤������ޤ�</description>
<minVersion>2.0pre</minVersion>
<maxVersion>2.0</maxVersion>
<updateURL>http://svn.coderepos.org/share/lang/javascript/vimperator-plugins/trunk/migemo-find.js</updateURL>
<author mail="hotchpotch@gmail.com" homepage="http://d.hatena.ne.jp/secondlife/">Yuichi Tateno</author>
<license>MIT</license>
<version>0.0.1</version>
<detail lang="ja"><![CDATA[
ɸ��� / �ʤɤθ����� XUL/Migemo �������֤������ޤ���
Ʊ���ε�ǽ����ĥץ饰����Ȥ��� migemize_find ������ޤ�����
migemo-find.js �� pIXMigemoFind ���󶡤��Ƥ��� XUL/Migemo �Υ��󥿡��ե�������ľ�����Ѥ��Ƥ��ޤ���

== ToDo ==

- migemo ����ɽ���ǥޥå������ѥ����󤹤٤Ƥˤ�����ȥϥ��饤��
-- �����Ϻǽ�˥ޥå�����ʸ����Τߥϥ��饤�Ȥ����

]]></detail>
</VimperatorPlugin>;

liberator.plugins.migemoFind = (function() {
    let p = function(m) Application.console.log(m);
    
    let evalWithContext = function(func, context) {
        let str;
        let fstr = func.toString();
        if (fstr.indexOf('function () {') == 0) {
            str = fstr.replace(/.*?{([\s\S]+)}.*?/m, "$1");
        } else {
            str = '(' + fstr + ')()';
        }
        return liberator.eval(str, context);
    }
    
    var XMigemoFind;
    try {
        XMigemoFind = Cc['@piro.sakura.ne.jp/xmigemo/find;1']
                                .getService(Ci.pIXMigemoFind);
    } catch(ex if ex instanceof TypeError){}

    if (!XMigemoFind) {
        liberator.echoerr("XUL/Migemo not found. You should be install XUL/Migemo.");
        return;
    }
    
    search.migemo = XMigemoFind.wrappedJSObject;
    search.migemo.target = window.gBrowser;

    if (!search._find)
        search._find = search.find;
    if (!search._findAgain)
        search._findAgain = search.findAgain;

    let setFound = function(f) {
        liberator.eval('found = ' + f.toString(), search._find);
    }
    
    if (!search.migemoFindEvnetListener) {
        search.migemoFindEvnetListener = search.migemo.document.addEventListener('XMigemoFindProgress', function(ev) {
            if (!ev.foundTerm) {
                liberator.echoerr("E486: Pattern not found: " + ev.findTerm, commandline.FORCE_SINGLELINE);
                setFound(false);
            } else {
                setFound(true);
            }
        }, false);
    }
    
    evalWithContext(function () {
       search.find = function (str) {
           search.migemo.find(false, str, options["linksearch"]);
           searchString = searchPattern = search.migemo.lastFoundWord;
       }
    }, search._find);
    
    evalWithContext(function () {
       search.findAgain = function (reverse) {
           let migemo = search.migemo;
           (!reverse) ? migemo.findNext(options["linksearch"]) : migemo.findPrevious(options["linksearch"]);
       }
    }, search._findAgain);
    return this;
})();


