---
title: King's Throne
categories: []
---

{%- capture _table_datafile -%}data/kings-throne/castles.json{%- endcapture -%}
{%- capture _table_options -%}
{%- endcapture -%}
{%- capture _table_tag -%}testtable{%- endcapture -%}
$.getJSON( "{{ site.baseurl }}/{% _table_datafile %}", function( data ) {
   var options={% _table_options %};
   $('#{%_table_tag%}').JSIronTable(options);

