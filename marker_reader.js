/*** BEGIN LICENSE BLOCK {{{
  Copyright (c) 2009 hogelog<konbu.komuro@gmail.com>

  Released under the GPL license
  http://www.gnu.org/copyleft/gpl.html
}}}  END LICENSE BLOCK ***/
// PLUGIN_INFO//{{{
var PLUGIN_INFO =
<VimperatorPlugin>
    <name>{NAME}</name>
    <description>marker PageDown/PageUp.</description>
    <author mail="konbu.komuro@gmail.com" homepage="http://d.hatena.ne.jp/hogelog/">hogelog</author>
    <version>0.0.4</version>
    <license>GPL</license>
    <minVersion>2.1pre</minVersion>
    <maxVersion>2.1pre</maxVersion>
    <updateURL>http://svn.coderepos.org/share/lang/javascript/vimperator-plugins/trunk/marker_reader.js</updateURL>
<detail><![CDATA[
    
== OPTION ==
>||
let g:marker_reader_scroll_ratio = "0.7"
||<
mnext, mprev scroll 0.7 * <screen height>.

>||
let g:marker_reader_onload = 0
||<
prevent PageLoad insert markers action.

== BUG ==
    - all marker are inserted at top(0,0) on some page.
]]></detail>
</VimperatorPlugin>;
//}}}
plugins.marker_reader = (function() {

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";

var libly = liberator.plugins.libly;
var $U = libly.$U;
var logger = $U.getLogger("marker");

var reader = {
    pageNaviCss:
    <style type="text/css"><![CDATA[
        .vimperator-marker_reader-marker {
            background-color: #faa;
            opacity: 0.30;
            margin: 0px;
            /*padding: 10px;*/
            height: 1.5em;
            width: 100%;
            font-weight: bold;
            text-align: left;
            position: absolute;
            -moz-border-radius: 5px;
        }
        ]]></style>,
    insertMarkers: function(doc)
    {
        let win = doc.defaultView;
        doc.naviMarker = true;

        let css = $U.xmlToDom(reader.pageNaviCss, doc);
        let node = doc.importNode(css, true);
        doc.body.insertBefore(node, doc.body.firstChild);

        let scroll_ratio = parseFloat(liberator.globalVariables.marker_reader_scroll_ratio) || 0.9;
        let scroll = win.innerHeight * scroll_ratio;
        let count = Math.ceil(win.scrollMaxY / scroll);

        let insertPoint = doc.body.firstChild;
        let markers = [];
        for (let pageNum=1;pageNum<=count+1;++pageNum)
        {
            let p = doc.createElementNS(HTML_NAMESPACE, "p");
            let id = "vimperator-marker_reader-" + pageNum;
            p.id = id;
            p.innerHTML = '<a href="#' + id + '">' + pageNum + "</a>";
            p.className = "vimperator-marker_reader-marker";

            p.style.left = 0;
            p.style.top = Math.ceil((pageNum-1)*scroll);
            p.style.zIndex = 1000;
            doc.body.insertBefore(p, insertPoint);
            //doc.body.appendChild(p);
            markers.push(p);
        }
        return doc.markers = markers;
    },
    removeMarkers: function(doc)
    {
        let markers = doc.markers;
        if (!markers) return false;
        for (let i=0,len=markers.length;i<len;++i)
        {
            doc.body.removeChild(markers[i]);
        }
        return true;
    },
    currentPage: function(doc)
    {
        let markers = doc.markers;
        let win = doc.defaultView;

        let curPos = win.scrollY;

        // top of page
        if (curPos <= 0) return 1.0;

        // bottom of page
        if (curPos >= win.scrollMaxY) {
            if (markers.length > 0) {
                let lastMarker = markers[markers.length-1].offsetTop;
                if (curPos <= lastMarker) return markers.length;
            }
            return markers.length + 0.5;
        }

        // return n.5 if between n and n+1
        let page = 1.0;
        for (let i=0,len=markers.length;i<len;++i)
        {
            let pos = parseInt(markers[i].offsetTop);
            logger.log(pos);
            if (curPos == pos) return page;
            if (curPos < pos) return page - 0.5;
            ++page;
        }
        return page - 0.5;
    },
    focusNavi: function(doc, count)
    {
        function navi(win, page)
        {
            let xpath = '//*[@id="vimperator-marker_reader-' + page + '"]';
            let [elem] = $U.getNodesFromXPath(xpath, doc);
            if (elem) {
                win.scrollTo(0, elem.offsetTop);
                return true;
            }
            return false;
        }
        let win = doc.defaultView;
        let curPage = reader.currentPage(doc);
        let page = (count < 0 ? Math.round : Math.floor)(curPage + count);
        logger.log(curPage);
        logger.log(page);
        if (page <= 1) {
            win.scrollTo(0, 0);
            return true;
        } else if (navi(win, page)) {
            return true;
        }

        reader.removeMarkers(doc);
        reader.insertMarkers(doc);
        if (navi(win, page)) return true;

        win.scrollTo(0, win.scrollMaxY);
        return true;
    },
};

commands.addUserCommand(["markersinsert", "minsert"], "insert markers",
    function ()
    {
        reader.insertMarkers(content.document);
    });
commands.addUserCommand(["markersremove", "mremove"], "remove markers",
    function ()
    {
        reader.removeMarkers(content.document);
    });
commands.addUserCommand(["markernext", "mnext"], "marker PageDown",
    function ()
    {
        reader.focusNavi(content.document, 1);
    });
commands.addUserCommand(["markerprev", "mprev"], "marker PageUp",
    function ()
    {
        reader.focusNavi(content.document, -1);
    });

if (liberator.globalVariables.marker_reader_onload !== 0) {
    gBrowser.addEventListener("load", function (event) {
        let win = (event.target.contentDocument||event.target).defaultView;
        if (win.frameElement) return;
        let doc = win.document;
        if (!(doc instanceof HTMLDocument)) return;
        if (doc.contentType != "text/html") return;

        reader.removeMarkers(doc);
        reader.insertMarkers(doc);
    }, true);
}

return reader;
})();
// vim: fdm=marker sw=4 ts=4 et:
