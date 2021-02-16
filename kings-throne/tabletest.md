---
title: King's Throne
categories: []
jsst: true
---

{%- capture _table_options -%}
{
    //fixedheader: true,
    scrollable: true,
    fitHeight: true,
    headercells: true,
    sortable: true, 
    //header: false,
    columns: [
        { title: "Level", datafield: "Level"},
        { title: "Name", datafield: "Name" },        
        { 
            title: "Requirements", 
            datafield: "Requirements",
            view: function ( data ) { 
                return 'I:'+data.Requirements.Intimacy+',A:'+data.Requirements.Attributes;
            }
        },
    ]
}
{%- endcapture -%}
{% include datatable.html id="testtable" datafile="data/kings-throne/castles.json" options=_table_options %}

{%- capture _table_options -%}
{
    scrollable: true,
    fitHeight: true,
    headercells: true,
    columns: [
        { title: "Name", datafield: "Name" },        
        { title: "Level", datafield: "Level"},
        { 
            title: "Requirements", 
            datafield: "Requirements",
            view: function ( data ) { 
                return 'I:'+data.Requirements.Intimacy+',A:'+data.Requirements.Attributes;
            }
        },
    ]
}
{%- endcapture -%}
{% include datatable.html id="testtable2" datafile="data/kings-throne/castles.json" options=_table_options %}
