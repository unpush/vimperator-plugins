// PLUGIN_INFO//{{{
var PLUGIN_INFO =
<VimperatorPlugin>
    <name>{NAME}</name>
    <description>character hint mode.</description>
    <author mail="konbu.komuro@gmail.com" homepage="http://d.hatena.ne.jp/hogelog/">hogelog</author>
    <version>0.2.0</version>
    <minVersion>2.0pre 2008/12/12</minVersion>
    <maxVersion>2.0a1</maxVersion>
    <date>2009/1/27 18:56</date>
    <updateURL>http://svn.coderepos.org/share/lang/javascript/vimperator-plugins/trunk/char-hints-mod2.js</updateURL>
    <detail><![CDATA[
== Usage ==
In default setting,
input quickhint in lowercase
and
select charhint label in uppercase.

== SETTING ==
let g:hintchars:
    set character used by char-hint.
    e.g.)
      let g:hintchars="hjkl"
let g:hintsinput:
    - "i" setting char-hint input lowercase.
    - "I" setting char-hint input uppercase.
    Default setting is "I".
    e.g.)
      let g:hintinput="i"

== TODO ==
     ]]></detail>
    <detail lang="ja"><![CDATA[
== Usage ==
デフォルトの設定では
小文字は候補を絞るためのテキスト入力に、
大文字は文字ラベルの選択に使います。

== SETTING ==
let g:hintchars:
    set character used by char-hint.
    e.g.)
      let g:hintchars="hjkl"
let g:hintinput:
    - "i" setting char-hint input lowercase.
    - "I" setting char-hint input uppercase.
    Default setting is "I".
    e.g.)
      let g:hintinput="i"

== TODO ==
     ]]></detail>
</VimperatorPlugin>;
//}}}

(function () {

    const DEFAULT_HINTCHARS = "HJKLASDFGYUIOPQWERTNMZXCVB";
    const hintContext = hints.addMode;

    let hintchars = DEFAULT_HINTCHARS;
    let inputCase = function(str) str.toUpperCase();
    let inputRegex = /[A-Z]/;

    function chars2num(chars) //{{{
    {
        let num = 0;
        hintchars = inputCase(hintchars);
        let base = hintchars.length;
        for(let i=0,l=chars.length;i<l;++i) {
            num = base*num + hintchars.indexOf(chars[i]);
        }
        return num;
    } //}}}
    function num2chars(num) //{{{
    {
        let chars = "";
        hintchars = inputCase(hintchars);
        let base = hintchars.length;
        do {
            chars = hintchars[((num % base))] + chars;
            num = Math.floor(num/base);
        } while(num>0);

        return chars;
    } //}}}
    function getStartNum(base, count) //{{{
    {
        let figure = 1;
        while((count/=base) >= 1.0) {
            ++figure;
        }
        return Math.pow(base, figure-1) - 1;
    } //}}}
    function getCharHints(win) //{{{
    {
        let hints = [];
        (function (win) {
            let elems = [elem for(elem in buffer.evaluateXPath("//*[@liberator:highlight and @number]", win.document))];
            hints = hints.concat(elems);
            Array.forEach(win.frames, arguments.callee);
        })(win);
        return hints;
    } //}}}
    function showCharHints(hints) //{{{
    {
        let start = getStartNum(hintchars.length, hints.length);
        for(let i=0,len=hints.length;i<len;++i) {
            let hint = hints[i];
            let num = hint.getAttribute("number");
            let hintchar = num2chars(parseInt(num, 10)+start);
            hint.setAttribute("hintchar", hintchar.toUpperCase());
        }
    } //}}}
    function isValidHint(hintInput, hint) //{{{
    {
        if(hintInput.length == 0) return false;
        let hintchar = hint.getAttribute("hintchar");
        return inputCase(hintchar).indexOf(hintInput) == 0;
    } //}}}
    function processHintInput(hintInput, hints) //{{{
    {
        let start = getStartNum(hintchars.length, hints.length);
        let num = chars2num(hintInput)-start;
        if(num < 0) return;
        let numstr = String(num);
        // no setTimeout, don't run nice ?
        setTimeout(function () {
            for(let i=0,l=numstr.length;i<l;++i) {
                let num = numstr[i];
                let alt = new Object;
                alt.liberatorString = num;
                charhints.original.onEvent(alt);
            }
            statusline.updateInputBuffer(hintInput);
            let validHints = hints.filter(function(hint) isValidHint(hintInput, hint));
            if(validHints.length == 1) {
                charhints.original.processHints(true);
                return true;
            }
        }, 10);
    } //}}}
    function setInputCase(type) //{{{
    {
        switch (type)
        {
            default:
            case "I":
                inputCase = function(str) str.toUpperCase();
                inputRegex = /[A-Z]/;
                break;
            case "i":
                inputCase = function(str) str.toLowerCase();
                inputRegex = /[a-z]/;
                break;
        }
    } //}}}

    var hintInput = "";
    var charhints = plugins.charhints = {
        show: function (minor, filter, win) //{{{
        {
            charhints.original.show(minor, filter, win);
            hintInput = "";
            let hints = getCharHints(window.content);
            showCharHints(hints);
        }, //}}}
        onInput: function (event) //{{{
        {
            let eventkey = events.toString(event);
            if(/^\d$/.test(eventkey)) {
                commandline.command += eventkey;
            }
            let hintString = commandline.command;
            commandline.command = hintString.replace(inputRegex, "");
            charhints.original.onInput(event);
            for(let i=0,l=hintString.length;i<l;++i) {
                if(inputRegex.test(hintString[i])) {
                    hintInput += hintString[i];
                }
            }
            let hints = getCharHints(window.content);
            showCharHints(hints);
            if(hintInput.length>0) processHintInput(hintInput, hints);
        }, //}}}
        onEvent: function (event) //{{{
        {
            if(/^\d$/.test(events.toString(event))) {
                charhints.onInput(event);
            } else {
                charhints.original.onEvent(event);
                statusline.updateInputBuffer(hintInput);
            }
        }, //}}}
    };

    if(!charhints.original) {
        charhints.original = {
            show: hints.show,
            onInput: liberator.eval("onInput", hintContext),
            onEvent: hints.onEvent,
            processHints: liberator.eval("processHints", hintContext),
        };

        charhints.install = function () //{{{
        {
            hints.show = charhints.show;
            hints.onEvent = charhints.onEvent;
            liberator.eval("onInput = plugins.charhints.onInput", hintContext);

            liberator.execute(":hi Hint::after content: attr(hintchar)", true, true);
            if(liberator.globalVariables.hintsinput) {
                let hintsinput = liberator.globalVariables.hintsinput;
                setInputCase(liberator.globalVariables.hintsinput);
            }
            if(liberator.globalVariables.hintchars) {
                hintchars = liberator.globalVariables.hintchars;
            }
        }; //}}}
        charhints.uninstall = function () //{{{
        {
            hints.show = charhints.original.show;
            hints.onEvent = charhints.original.onEvent;
            liberator.eval("onInput = plugins.charhints.original.onInput", hintContext);

            liberator.execute(":hi Hint::after content: attr(number)");
        }; //}}}
    }
    charhints.install();
})();

// vim: set fdm=marker sw=4 ts=4 et fenc=utf-8:
