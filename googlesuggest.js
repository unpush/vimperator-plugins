// Vimperator plugin: 'Completion by Google Suggest'
// Last Change: 21-Mar-2008. Jan 2008
// License: Creative Commons
// Maintainer: Trapezoid <trapezoid.g@gmail.com> - http://unsigned.g.hatena.ne.jp/Trapezoid
//
// search word completion using Google Suggest script for Vimperator 0.6.*

liberator.commands.addUserCommand(['google'],"Search Web sites with Google Suggest",
    function(arg){
        const endpoint = "http://www.google.co.jp/search?q=";
        //liberator.open(endpoint + encodeURIComponent(arg));
        liberator.open(endpoint + encodeURIComponent(arg),liberator.NEW_TAB);
    },
    {
        completer: function (filter) {
            const endPoint = "http://suggestqueries.google.com/complete/search?output=firefox&client=firefox"
            var [lang] = Components.classes["@mozilla.org/network/protocol;1?name=http"]
                                   .getService(Components.interfaces.nsIHttpProtocolHandler)
                                   .language.split("-", 1);
            var xhr = new XMLHttpRequest();
            var completionList = [];

            xhr.open("GET",endPoint + "&hl=" + lang + "&qu=" + encodeURIComponent(filter),false);
            xhr.send(null);
            var response = window.eval(xhr.responseText)[1];

            for each (var r in response)
                completionList.push([r,"Suggests"]);
            return [0,completionList];
        }
    }
);
// vim:sw=4 ts=4 et:
