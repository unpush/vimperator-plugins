/**
 * ==VimperatorPlugin==
 * @name           migemo_completion.js
 * @description    replace completion function with using Migemo
 * @description-ja �⊮�֐���Migemo���g�p�������̂Ɏ��ւ���
 * @author         Trapezoid
 * @version        0.2
 * ==/VimperatorPlugin==
 *
 * Support commands:
 *  - :buffer
 *  - :sidebar
 *  - :emenu
 *  - :dialog
 *  - :help
 *  - :macros
 *  - :play
 *  and more
 **/

(function () {
  var XMigemoCore = Components.classes['@piro.sakura.ne.jp/xmigemo/factory;1']
                              .getService(Components.interfaces.pIXMigemoFactory)
                              .getService("ja");
  var XMigemoTextUtils = Components.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
                                   .getService(Components.interfaces.pIXMigemoTextUtils);

  function replaceFunction(target,symbol,f,originalArguments){
      var oldFunction = target[symbol];
      target[symbol] = function() f.apply(target,[oldFunction.apply(target,originalArguments || arguments), arguments]);
  }

  replaceFunction(liberator.modules.completion,"buffer",function(oldResult,args){
      var filter = args[0];
      var migemoPattern = new RegExp(XMigemoCore.getRegExp(filter));
      return [0, oldResult[1].filter(function([value,label]){
          return migemoPattern.test(value) || migemoPattern.test(label)
          })];
  },[""]);
  liberator.modules.completion.filter = function(array,filter,matchFromBeginning){
      if(!filter) return array;

      if (filter.match(/[()|]/))
          return original_filter.apply(this, arguments);

      try {
          var original = XMigemoTextUtils.sanitize(filter);
          var migemoString = XMigemoCore.getRegExp(filter);
          migemoString = original + '|' + migemoString;
          if(matchFromBeginning)
              migemoString ="^(" + migemoString + ")";
          var migemoPattern = new RegExp(migemoString, 'i');
      } catch (e) {
          return original_filter.apply(this, arguments);
      }

      return array.filter(function([value,label]){
              return migemoPattern.test(value) || migemoPattern.test(label)
          });
  }
})();
