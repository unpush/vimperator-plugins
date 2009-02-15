//
// subscldr.js
// 
// LICENSE: {{{
//   Copyright (c) 2009 snaka<snaka.gml@gmail.com>
// 
//     Distributable under the terms of an MIT-style license.
//     http://www.opensource.jp/licenses/mit-license.html
// }}}
//
// PLUGIN INFO: {{{
var PLUGIN_INFO =
<VimperatorPlugin>
<name>subscldr</name>
<description>Add subscription to LivedoorReader in place.</description>
<description lang="ja">ページ遷移なしでLivedoorReaderにフィードを登録します</description>
<minVersion>2.0pre</minVersion>
<maxVersion>2.0</maxVersion>
<updateURL>http://svn.coderepos.org/share/lang/javascript/vimperator-plugins/trunk/subscldr.js</updateURL>
<author mail="snaka.gml@gmail.com" homepage="http://vimperator.g.hatena.ne.jp/snaka72/">snaka</author>
<license>MIT style license</license>
<version>0.1</version>
<detail><![CDATA[
== Subject ==
Add subscription to LivedoorReader in place.

== Commands ==
>||
:subscldr
||<

]]></detail>

<detail lang="ja"><![CDATA[
== 概要 ==
ページ遷移すること無しにLivedoorReaderへのフィードの登録を行います。

== コマンド ==
>||
:subscldr
||<

]]></detail>
</VimperatorPlugin>;
// }}}

liberator.plugins.subscldr = (function(){
  // PUBLIC {{{
  var PUBLICS = {
    // for DEBUG {{{
    //getSubscription: getSubscription,
    //postSubscription: postSubscription,
    //selectFeed: selectFeed
    // }}}
  };

  // }}}
  // COMMAND {{{
  commands.addUserCommand(
    ["subscrldr"],
    "Register feeds subscription to Livedoor Reader.",
    function(args) {
      handleFeedRequest();
    },  
    null,
    true  // Use in DEVELOP
  );

  // }}}
  // PRIVATE {{{
  const endpoint = 'http://reader.livedoor.com/subscribe/';
  const DEBUG_URL = 'http://d.hatena.ne.jp/snaka72/';

  function handleFeedRequest(redirectUrl, force) {
      liberator.echo("force: " + force);

      var subscribeInfo = getSubscription(redirectUrl);
      var availableLinks = subscribeInfo.feedlinks.filter(function(info) info[1]);
      var alreadySubscribed = availableLinks.length != subscribeInfo.feedlinks.length;

      if (alreadySubscribed && !force) {
        liberator.echo("This site has already been subscribed. Are you sure to want to add subscription?");
        commandline.input("Add? (y or n):",
          function(ans) {
            if (ans.match(/y|yes/i))
              handleFeedRequest(null, true);
            else
              liberator.echo("Canceled.");
            commandline.close();
          } 
        );
        return;
      }

      switch (availableLinks.length) {
      case 0:
        if (alreadySubscribed)
          liberator.echo("This site feed has already been subscribed.");
        else
          // Maybe never reach here.
          liberator.echoerr("SITE FEED NOT AVAILABLE!!!");
        break;
      case 1:
        liberator.log("FEED ONLY ONE!!");
        subscribeInfo.feedlinks = [availableLinks[0][0], true];
        postSubscription(subscribeInfo);
        break;
      default:
        liberator.log("SOME FEED AVAILABLE");
        selectFeed( availableLinks.map(function(i) [i[0], ""]),
          function(sel) {
            liberator.log("SELECTED FEED:" + sel);
            liberator.echo("Redirected ...");
            var redirectUrl = endpoint + '?url=' + encodeURIComponent(sel);
            handleFeedRequest(redirectUrl); 
          }
        );
      }
  }

  function getSubscription(target) {
    liberator.echo('Please wait ...');
    var subscribeInfo;
    
    // for DEBUG
    var uri = target || endpoint + buffer.URL;

    var req = new libly.Request(uri, null, {asynchronous: false});
    req.addEventListener('onSuccess', function(res) {
      liberator.log(res.responseText);
      res.getHTMLDocument();
      subscribeInfo = getSubscribeInfo(res.doc);
      liberator.log(subscribeInfo.toSource());
    });
    req.get();

    return subscribeInfo;
  }

  function getSubscribeInfo(htmldoc) {
    var subscribeInfo = {
       target_url: null,
       register: 1,
       apiKey: null,
       feedlinks: []
    };

    $LXs("//ul[@id='feed_candidates']/li", htmldoc).forEach( function(item) {
      var feedlink = $LX('./a[@class="feedlink"]', item);
      var yet = $LX('./input[@name="feedlink"]', item);
      liberator.log('input:' + feedlink.href);
      subscribeInfo.feedlinks.push([feedlink.href, (yet != null)]);
    });

    var target_url = $LX('//*[@id="target_url"]', htmldoc);
    if (!target_url) throw "Cannot find subscribe info about this page!";
    subscribeInfo.target_url = target_url.value;
    liberator.log('target_url:' + subscribeInfo.target_url);

    subscribeInfo.apiKey = $LX('//*[@name="ApiKey"]', htmldoc).value;
    if (!subscribeInfo.apiKey) throw "Can't get API Key for subscription!";
    return subscribeInfo;
  }

  function postSubscription(info) {
    liberator.log("subscribe:" + info.toSource());

    var postBody= "url=" + encodeURIComponent(info.target_url) +
                  "&folder_id=0" +
                  "&rate=0" +
                  "&register=1" +
                  "&feedlink=" + encodeURIComponent(info.feedlinks[0]) +
                  "&public=1" +
                  "&ApiKey=" + info.apiKey;

    liberator.log("POST DATA:" + postBody);
    var req = new libly.Request(
      endpoint,
      null,
      {
        asyncronus: false,
        postBody: postBody
      }
    );
    req.addEventListener('onSuccess', function(data) {
      liberator.log("Posted: " + data.responseText);
      liberator.echo("Posted: " + data.statusText);
    });
    req.addEventListener('onFailure', function(data) {
      liberator.log("POST FAILURE: " + data.responseText);
      liberator.echoerr("POST FAILURE: " + data.statusText);
    });

    req.post();
  }

  function selectFeed(links, next) {
    liberator.log(links.toSource());
    liberator.echo("Following feeds were found this site. Which are you subscribe?");
    commandline.input("Input feed no. ", function(selected) {
      liberator.echo("You select " + selected + ".");
      commandline.close();
      if (next && typeof next == 'function')
        next(selected);
      else
        liberator.echoerr("Your selected no is invalid.");
    },{
      completer: function(context) {
        context.title = ["Available feeds"];
        context.completions = links;
      }
    });
    // Open candidates list forcibly
    events.feedkeys("<TAB>");
  }

  // For convinience 
  function $LXs(a,b) libly.$U.getNodesFromXPath(a,b);
  function $LX(a,b)  libly.$U.getFirstNodeFromXPath(a,b);
 
  // }}}
  return PUBLICS;
})();

// vim:sw=2 ts=2 et si fdm=marker:
