(function(){var d={height:666,width:382,name:"UKRadioPlayerPopup",optOutClass:"popup_off",domainMatch:[".co.uk",".com"],urlMatch:"/radio/player"};function f(){if(d.height>window.screen.availHeight){d.height=window.screen.availHeight}var j="width="+d.width+",height="+d.height+",scrollbars=no,toolbar=no,personalbar=no,location=no,directories=no,menubar=no,status=no,resizable=no";return j}function b(k){var j=f(),l=window.open(k,d.name,j);if(l){l.focus();return false}return true}function e(j){var k;if(j.target){k=j.target}else{if(j.srcElement){k=j.srcElement}}if(k&&k.nodeName){while(k.nodeName.toLowerCase()!=="a"&&(k.parentNode)){k=k.parentNode}}if(j.preventDefault){j.preventDefault()}else{if(j.returnValue){j.returnValue=false}}b(k.href);return false}function h(){var q=document.getElementsByTagName&&document.getElementsByTagName("A");var p=q.length;var l=d.domainMatch.length;for(var n=0;n<p;n++){var o=q[n];for(var k=0;k<l;k++){var m=d.domainMatch[k]+d.urlMatch;if((o.href.indexOf(m)!==-1)&&(o.className.indexOf(d.optOutClass)===-1)){i(o,"click");c(o,"click",e)}}}}function i(j,k){j["on"+k]=null;if(typeof window.$!=="undefined"){g(window.$,j,k)}else{if(typeof window.jQuery!=="undefined"){g(window.jQuery,j,k)}}if(typeof window.require!=="undefined"){if(require.defined("jquery-1")){require(["jquery-1"],function(l){g(l,j,k)})}if(require.defined("jquery-1.9")){require(["jquery-1.9"],function(l){g(l,j,k)})}}}function g(l,j,k){if(parseFloat(l.fn.jquery)>=1.8){l(j).off(k)}else{l(j).unbind(k)}}function a(m,j,l,k){if(parseFloat(m.fn.jquery)>=1.8){m(j).on(l,k)}else{m(j).bind(l,k)}}function c(j,l,k){if(typeof window.$!=="undefined"){a(window.$,j,l,k);return}else{if(typeof window.jQuery!=="undefined"){a(window.jQuery,j,l,k);return}}if(typeof window.require!=="undefined"){if(require.defined("jquery-1.9")){require(["jquery-1.9"],function(m){a(m,j,l,k)});return}if(require.defined("jquery-1")){require(["jquery-1"],function(m){a(m,j,l,k)});return}}if(j.addEventListener){j.addEventListener(l,k,false)}else{if(j.attachEvent){j.attachEvent("on"+l,k)}}}c(window,"load",h)}());