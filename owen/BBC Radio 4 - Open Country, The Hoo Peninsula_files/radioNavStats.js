define(["jquery-1.9","istats-1","radioNav"],function(n,t,e){function a(n,e,a,i){i="function"==typeof i?i:null,a=a||{},a.ns_ti=document.title,t.log(n,e,a,i),i&&setTimeout(i,3e3)}e.addEventListener("open",function(e){t.track("internal",{region:n(".rsn-panel")}),n("#rsn-stations-panel .rsn-stations-list li").each(function(t,e){var a=n(this).data("networkid");a&&(e.linktrack={station_link:"radionav_stations_"+a})}),n(".rsn-categories-list li").each(function(t,e){var a=n(this).data("category");a&&(e.linktrack={station_link:"radionav_categories_"+a})}),n("#rsn-schedules-panel .rsn-stations-list li").each(function(t,e){var a=n(this).data("networkid");a&&(e.linktrack={station_link:"radionav_schedules_"+a})}),a("open","radionav_drawer_action",{action_type:"open",panel_name:e})}),e.addEventListener("focus",function(){a("focus","radionav_search_focus",{action_type:"focus"})}),e.addEventListener("close",function(n){a("close","radionav_drawer_action",{action_type:"close",panel_name:n})}),e.addEventListener("clear",function(){a("clear","radionav_search_clear",{action_type:"click"})}),e.addEventListener("minimise",function(){a("minimise","radionav_search_minimise",{action_type:"click"})}),e.addEventListener("results",function(n){a("search","autosuggest_search",{radionav_search_query:n.query,radionav_search_results_programmes_count:n.programmesResultsCount,radionav_search_results_stations_count:n.networkResultsCount,radionav_search_results_categories_count:n.categoriesResultsCount})})});
//# sourceMappingURL=radioNavStats.js.map