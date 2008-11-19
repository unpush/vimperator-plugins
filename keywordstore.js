/**
 * ==VimperatorPlugin==
 * @name			KeywordStore.js
 * @description			Store the keywords when ":open" or ":tabopen" launched
 * @author			Y. Maeda (clouds.across.the.moon@gmail.com)
 * @link			
 * @version			0.1
 * ==/VimperatorPlugin==
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Usage:
 *  :kssearch <str>
 * if <str> is nothing, incremental search starts by last keyword on ":open" or ":tabopen".
 * <str> could be completed by using history of keywords which used on ":open" or ":tabopen".
 * 
 * Tested on:
 *	Firefox version: 3.0.3
 *	Vimperator version: 1.2
 *		url: https://addons.mozilla.org/en-US/firefox/addon/4891
 */
(function (){
var queue = [];

function push(strs){
	for(var i = strs.length-1; i >= 0; i--){
//		if((strs[i] != "") && !(queue.some(function(s){return s==strs[i]} ))){
		if(strs[i] != "" && queue[0] != strs[i]){
			queue.unshift(strs[i]);
		}
	}
}

function search(str){
	str= str || queue[0];
	liberator.commandline.open("/", str, modes.SEARCH_FORWARD);
}

function suggestions(str){
	return queue
		  .filter(function(i){return i.indexOf(str) == 0})
		   .map(function(i){return [i, "Stored Keyword"]});
}

function completer(str){
		return [0, suggestions(str)];
}


/* ����window.getShortcutOrURI��ޔ����Ă����B*/
if(!plugins["keywordStore"] || !plugins.keywordStore["__getShortcutOrURI"]){
	var __getShortcutOrURI = window.getShortcutOrURI
}else{
	var __getShortcutOrURI = plugins.keywordStore.__getShortcutOrURI
}

/* ":open"�����Ă΂ꂽ�Ƃ��ɁA�L�[���[�h���L���[�ɓ����悤��window.getShortcutOrURI��u�������� */
window.getShortcutOrURI=function(aURL, aPostDataRef){
	push(aURL.split(" ").slice(1));
	return __getShortcutOrURI(aURL, aPostDataRef);
};

/***  User Command ***/
commands.addUserCommand(['kssearch'], 'KeywordStore search',
	function(str){search(str)},
	{completer: completer}, true);

/***  �O������g����悤�� ***/
liberator.plugins.keywordStore = {
	push:		push,
	search:		search,
	suggestions:	suggestions,
	completer:	completer,
	queue:		queue,

	/* ����window.getShortcutOrURI�̑ޔ�� */
	__getShortcutOrURI:	__getShortcutOrURI,
};

})();
