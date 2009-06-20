// PLUGIN_INFO//{{{
var PLUGIN_INFO =
<VimperatorPlugin>
  <name>retweet</name>
  <description>ReTweet This Page.</description>
  <description lang="ja">$B3+$$$F$$$k(BTweet$B$r(BReTweet$B$7$^$9!#(B</description>
  <author mail="from.kyushu.island@gmail.com" homepage="http://iddy.jp/profile/from_kyushu">from_kyushu</author>
  <version>0.1</version>
  <license>GPL</license>
  <minVersion>1.2</minVersion>
  <maxVersion>2.1</maxVersion>
  <updateURL>http://svn.coderepos.org/share/lang/javascript/vimperator-plugins/trunk/retweet.js</updateURL>
  <require type="plugin">_libly.js</require>
  <detail><![CDATA[

== Command ==
Usage:
  :rtt
    ReTweet This Post.

  ]]></detail>
</VimperatorPlugin>;
//}}}
//
(
  function()
  {
    var password;
    var username;
    var passwordManager = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);
    var $U = liberator.plugins.libly.$U;

    function getBody()
    {
      var body = $U.getFirstNodeFromXPath("//span[@class='entry-content']").innerHTML;
      var tags = body.match(/<.*?>/g);
      for(tag in tags)
      {
        body = body.replace(tags[tag],"");
      }
      return body;
    }

    function getUserName()
    {
      return $U.getFirstNodeFromXPath("//div[@class='screen-name']/a").innerHTML;
    }

    function getShortenUrl(longUrl)
    {
      var xhr = new XMLHttpRequest();
      var req = "http://bit.ly/api?url=" + longUrl;
      xhr.open('GET',req, false);
      xhr.send(null);
      if (xhr.status != 200)
      {
        return longUrl;
      }
      return xhr.responseText;
    }

    function sendTwitter(url,name,body)
    {
      var xhr = new XMLHttpRequest();
      var statusText = "RT @" + name + " [" + url +"]: " + body;
      xhr.open("POST", "http://twitter.com/statuses/update.json", false, username, password);
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      xhr.send("status=" + encodeURIComponent(statusText) + "&source=Vimperator");
    
      liberator.echo("[RT] Your post was sent. " );
    }

    commands.addUserCommand(
      ['retweet[This]','rtt'],
      'ReTweet This.',
      function()
      {
        try
        {
          var logins = passwordManager.findLogins({}, "http://twitter.com","https://twitter.com",null);
          var body = getBody();
          var name = getUserName();
          var url = getShortenUrl(buffer.URL);
          if(logins.length)
          {
            username = logins[0].username;
            password = logins[0].password;
            sendTwitter(url,name,body);
          }
          else if (liberator.globalVariables.twitter_username && liberator.globalVariables.twitter_password)
          {
            username = liberator.globalVariables.twitter_username;
            password = liberator.globalVariables.twitter_password;
            sendTwitter(url,name,body);
          }
          else
          {
            throw "Accont not found";
          }
        }
        catch(e)
        {
          liberator.echoerr(e);
        }
      }
    );
  }
)();
