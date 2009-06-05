//
//  hatebuWatchDog.js     - hatena bookmark watch dog -
//
// LICENSE: {{{
//
// This software distributable under the terms of an MIT-style license.
//
// Copyright (c) 2009 snaka<snaka.gml@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//
// OSI page : http://opensource.org/licenses/mit-license.php
// Japanese : http://sourceforge.jp/projects/opensource/wiki/licenses%2FMIT_license
//
// }}}
// PLUGIN INFO: {{{
let PLUGIN_INFO =
<VimperatorPlugin>
  <name>{NAME}</name>
  <description>Make notify hatebu-count when specified site's hatebu-count changed.</description>
  <description lang="ja">$B;XDj$5$l$?%5%$%H$N$O$F%V?t$r4F;k!"JQF0$,$"$C$?$i$*CN$i$;$7$^$9!#(B</description>
  <minVersion>2.0pre</minVersion>
  <maxVersion>2.0</maxVersion>
  <updateURL>http://svn.coderepos.org/share/lang/javascript/vimperator-plugins/trunk/hatebuWatchDog.js</updateURL>
  <author mail="snaka.gml@gmail.com" homepage="http://vimperator.g.hatena.ne.jp/snaka72/">snaka</author>
  <license>MIT style license</license>
  <version>1.0</version>
  <detail><![CDATA[
    == Subject ==
      Make notify hatebu-count when specified site's hatebu-count changed.
      Usage is just put this script into vimperator's plugin directory.

    == Global variables ==
      g:hatebuWatchDogInterval:
        Number. Watching interval. Default:600 Min:60
      g:hatebuWtachDogTargets:
        String. Sites where it wants you to watch.
        If you want watch only one site, you should specify like following.
        >||
          :let g:hatebuWatchDogTargets = "http://d.hatena.ne.jp/snaka72/"
        ||<
        If you want watch more than one site, you should specify like following.
        >||
          :let g:hatebuWatchDogTargets = "['http://d.hatena.ne.jp/snaka72/', 'http://vimperator.g.hatena.ne.jp/snaka72/']"
        ||<
      g:hatebuWatchDogAlways:
        Boole. Make notify every time. (for debug) Default:false

  ]]></detail>
  <detail lang="ja"><![CDATA[
    == $B35MW(B ==
      $B;XDj$5$l$?%5%$%H$NHo$O$F%V?t$r4F;k$7$F!"$=$N?tCM$KJQF0$,$"$C$?$i$*CN$i$;$7$^$9!#(B
      $B;H$$J}$O!"$3$N%9%/%j%W%H$r(BVimperator$B$N(Bplugin$B%G%#%l%/%H%j$K3JG<$9$k$@$1$G$9!#(B

    == $B%0%m!<%P%kJQ?t(B ==
      g:hatebuWatchDogInterval:
        Number. $B4F;k$N4V3V(B($BIC(B). $B%G%U%)%k%H(B600 $B@_Dj2DG=$J:G>.CM(B:60
      g:hatebuWtachDogTargets:
        String. Sites where it wants you to watch
        $B4F;kBP>]$N%5%$%H$,0l$D$@$1$N>l9g$O0J2<$N$h$&$K@_Dj$7$^$9!#(B
        >||
          :let g:hatebuWatchDogTargets = "http://d.hatena.ne.jp/snaka72/"
        ||<
        $B4F;kBP>]$N%5%$%H$,$,J#?t$N>l9g$O0J2<$N$h$&$K@_Dj$7$^$9!#(B
        >||
          :let g:hatebuWatchDogTargets = "['http://d.hatena.ne.jp/snaka72/', 'http://vimperator.g.hatena.ne.jp/snaka72/']"
        ||<
      g:hatebuWatchDogAlways:
        Boole. $BKh2sJs9p$r5s$2$k$+$I$&$+!#%G%U%)%k%H(B:false $B!J<g$K$G%P%C%0MQ!K(B

    == ToDo ==
      - $B?7Ce%V%C%/%^!<%/$N%f!<%6(Bid$B$H%3%a%s%H$NI=<((B

    ]]></detail>
  </VimperatorPlugin>;
// }}}

// Clear all watchers if started watcher exists.
if (plugins.hatebuWatchDog && plugins.hatebuWatchDog.stopWatching)
  plugins.hatebuWatchDog.stopWatching();

let publics = plugins.hatebuWatchDog = (function() {
  // PRIVATE //////////////////////////////////////////////////////////////{{{
  const libly = plugins.libly;
  let previousValue = 0;
  let tasks = [];

  function getCurrentValue(target, onSuccess, onFailure) {
    // build hatebu xml-rpc request
    let req = new libly.Request(
      'http://b.hatena.ne.jp/xmlrpc',
      {
        'Content-Type' : 'text/xml'
      },{
        postBody : <methodCall>
                     <methodName>bookmark.getTotalCount</methodName>
                     <params>
                       <param><value><string>{target}</string></value></param>
                     </params>
                   </methodCall>.toXMLString()
      }
    );

    let currentValue;
    req.addEventListener("onSuccess", function(data) {
      liberator.log("XML-RPC request was succeeded.");
      let resXml = new XML(data.responseText.replace(/^<\?xml version[^>]+?>/, ''));
      currentValue = window.eval(resXml..int.toString());
      onSuccess(currentValue);
    });
    req.addEventListener("onFailure", function(data) {
      onFailure();
    });
    liberator.log("reauest...");
    req.post();
    liberator.log("done...");
  }

  function notifyAlways()
    window.eval(liberator.globalVariables.hatebuWatchDogAlways) || false;

  function showHatebuNotification(targetSite, currentValue, delta) {
    let title = delta >= 0
              ? "hatebuWatchDog\u304B\u3089\u306E\u304A\u77E5\u3089\u305B"  // ordinary notification
              : "\u6B8B\u5FF5\u306A\u304A\u77E5\u3089\u305B"                // bad notification
    let suffix = delta != 0 ? "\u306B\u306A\u308A\u307E\u3057\u305F\u3002"
                            : "\u3067\u3059\u3002";
    let message = "'" + targetSite + "' \u306E\u88AB\u306F\u3066\u30D6\u6570\u306F '" +
                  currentValue + "' " + suffix + " (" + getSignedNum(delta) + ")";

    showAlertNotification(null, title, message);
  }

  function showAlertNotification(icon, title, message) {
    Cc['@mozilla.org/alerts-service;1']
    .getService(Ci.nsIAlertsService)
    .showAlertNotification(
      icon, //'chrome://mozapps/skin/downloads/downloadIcon.png',
      title,
      message
    );
  }

  function getSignedNum(num) {
    if (num > 0) return "+" + num;
    if (num < 0) return "-" + Math.abs(num);
    return "0";
  }

  function getInterval()
    window.eval(liberator.globalVariables.hatebuWatchDogInterval) || 600; // default : 10 min.

  // for debug
  let log  = liberator.log;
  let dump = liberator.dump;

  // }}}
  // PUBLIC ///////////////////////////////////////////////////////////////{{{
  let self = {
    startWatching: function() {
      let targets;
      try {
        targets = window.eval(liberator.globalVariables.hatebuWatchDogTargets);
      } catch(e) {
        targets = liberator.globalVariables.hatebuWatchDogTargets;
      }
      if (targets) {
        if (!(targets instanceof Array))
          targets = [targets];
        let i = 1, delay = 5000;
        log("before setTimeout()");
        targets.forEach(function(targetSite) {
            setTimeout(function() {
              publics.addTask({site : targetSite});
            }, delay * i++);
        });
        log("after setTimeout()");
      }
      else {
        liberator.echoerr("Please set g:hatebeWatchDogTargets before watching().");
      }
    },

    addTask: function(target) {
      dump(target.site);
      const MINUTE = 60; // sec.
      interval = getInterval() || (10 * MINUTE);       // default 10 min.
      interval = Math.max(interval, MINUTE);      // lower limt is 1 min.

      // initialize previous value
      target.previousValue = 0;
      target.initialize = true;
      publics.watching(target);

      // set watching interval
      tasks.push(setInterval(publics.watching, 1000 * interval, target));
      dump({target: target, interval: interval});
    },

    clearAllTasks: function() {
      tasks.forEach(function(task) {
          clearInterval(task);
      });
      tasks = [];
      dump("watch dog is sleeping...");
    },

    watching: function(target) {
      dump("watching...");
      dump(target);

      getCurrentValue(
        target.site,
        function(currentValue) {
          if (target.initialize) {
            target.initialize = false;
            target.previousValue = currentValue;
            return;
          }
          let delta =  currentValue - target.previousValue;
          if (delta || notifyAlways()) {
            showHatebuNotification(target.site, currentValue, delta);
          }
          target.previousValue = currentValue;
        },
        function() {
          liberator.echoerr("Cannot get current value.");
        }
      );
    }
  };
  // }}}
  return self;
})();

// Awaking the watch dog.
publics.startWatching();
liberator.dump("Watch dog is awaking ...");
// vim: sw=2 ts=2 et fdm=marker
