/*
* JSSteelTable - Copyright 2021 Kolossi
* 
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* 
*     http://www.apache.org/licenses/LICENSE-2.0
* 
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
* */

;(function ($, window, document, undefined) {

    var pluginName = "JSSteelTable",
        dataKey = "plugin_" + pluginName;

    var JSSteelTable = function (element, options) {
    
        this.element = element;
        
        this.options = {
            data: [],
            fitHeight: false,
            maxHeight: 0,
            fixedheader: true,
            scrollable: true,
            sortable: false,
            headerfontsize: "12pt",
            cellfontsize: "12pt",
            columns: []
        };
        
        this.init(options);
    };

    JSSteelTable.prototype = {
        init: function (options) {
            $.extend(this.options, options);
            
            var self = this;
            this.body = $('<div class="jsst_body"></div>');
            this.element.html(this.body);

            // Enable or Disable the Max Height property
            //
            if(this.options.maxHeight !== null && typeof this.options.maxHeight !== 'undefined')
            {
                if(this.options.maxHeight !== 0)
                {
                    $(this.element).css("max-height", this.options.maxHeight);
                }
            }

            // Make Table Scrollable if enabled ( Enabled by default )
            if(this.options.scrollable !== null && typeof this.options.scrollable !== 'undefined')
            {
                if(this.options.scrollable === true)
                {
                    $(this.element).css("overflow-y", "auto");
                } else {
                    $(this.element).css("overflow-y", "hidden");
                }
            }
            

            this.listeners = {};
            this.rows = [];
            this.cols = [];
            this.headercells = [];            
            this.columnfields = [];
            this.initialHeight = 0;

            // Create Elements
            setTimeout(function()
            {
                try
                {
                    if(self.Validate(options))
                    {
                        self._generateheader = true;
                        if(self.Validate(options.header))
                        {
                            if(options.header == false)
                            {
                                self._generateheader = false;
                            }
                        }
                        
                        if(self._generateheader && self.Validate(options.columns))
                        {
                            if($(self.element).find('.jsst_heading').length !== 0)
                            {
                                $(self.element).find('.jsst_heading').remove();                                
                            }
                            
                            self.heading = $('<div class="jsst_heading"></div>');
                            self.element.prepend(self.heading);
        
                            if(self.Validate(options.fixedheader))
                            {
                                if(options.fixedheader)
                                {
                                    $(self.heading).addClass("jsst_fixedheader");
                                }
                            }
                        }
        
                        // Create Header
                        //
                        try
                        {
                            self.CreateHeader();
                        } catch(ex)
                        {
                            console.log("JSSteelTable Error creating Header: "+ex);
                        }
                        
        
                        // Create Data
                        //
                        try
                        {
                            self.CreateData();
                        } catch(ex)
                        {
                            console.log("JSSteelTable Error creating Data: "+ex);
                        }
        
                        self.initialHeight = self.element.height();
        
                        self.FitSize();
                        $(window).resize(function() {                    
                            self.FitSize();
                        });

                        if(self.Validate(self.listeners))
                        {
                            if(self.Validate(self.listeners.OnInitialized))
                            {
                                if(typeof self.listeners.OnInitialized === "function")
                                {
                                    self.listeners.OnInitialized();
                                }
                            }
                        }                    
                    } else {
                        Notify(self, "No options defined");
                    }
                } catch(ex)
                {
                    ThrowError(self ,ex);
                }  
            },200);                      
        },

        OnInitialized(callback)
        {
            if(this.options.debug) console.log("JSSteelTable -> OnInitialized()");
            if(this.listeners.OnError !== null && typeof this.listeners.OnError !== 'undefined')
            {
                this.listeners.OnInitialized = callback;
            }            
        },

        OnError(callback)
        {
            if(this.options.debug) console.log("JSSteelTable -> OnError()");
            if(this.listeners.OnError !== null && typeof this.listeners.OnError !== 'undefined')
            {
                this.listeners.OnError = callback;
            }            
        },

        OnSort(callback)
        {
            if(this.options.debug) console.log("JSSteelTable -> OnSort()");
            if(this.listeners.OnSort !== null && typeof this.listeners.OnSort !== 'undefined')
            {
                this.listeners.OnSort = callback;
            }
            
        },

        BeforeSort(callback)
        {
            if(this.options.debug) console.log("JSSteelTable -> BeforeSort()");
            if(this.listeners.BeforeSort !== null && typeof this.listeners.BeforeSort !== 'undefined')
            {
                this.listeners.BeforeSort = callback;
            }            
        },

        OnReload(callback)
        {
            if(this.options.debug) console.log("JSSteelTable -> OnReload()");
            if(this.listeners.OnReload !== null && typeof this.listeners.OnReload !== 'undefined')
            {
                this.listeners.OnReload = callback;
            }            
        },

        Validate: function(variable)
        {
            var result = false;
            if(variable !== null && typeof variable !== 'undefined')
            {
                result = true;
            }
            return result;
        },

        Reload: function()
        {
            $(this.body).html('');
            this.CreateData();

            if(this.listeners.OnReload !== null && typeof this.listeners.OnReload !== 'undefined' && typeof this.listeners.OnReload === "function")
            {
                this.listeners.OnReload();
            }            
        },

        ReloadAll: function()
        {
            $(this.heading).html("");
            this.CreateHeader();

            $(this.body).html('');
            this.CreateData();

            if(this.listeners.OnReload !== null && typeof this.listeners.OnReload !== 'undefined' && typeof this.listeners.OnReload === "function")
            {
                this.listeners.OnReload();
            }
        },

        StartLoader: function()
        {
            $(this.body).html('<div class="jsst_loader_container"><div class="jsst_loader"></div></div>');
        },

        Clear: function()
        {
            $(this.body).html("");
            var nodatatxt = "No data available";
            if(this.Validate(this.options))
            {
                if(this.Validate(this.options.nodatatext))
                {
                    nodatatxt = this.options.nodatatext;
                }
            }
            
            Notify(this, nodatatxt);
        },

        GetRows: function()
        {
            //var allrows = this.rows.map(function(item) { return item["data"]; });
            var allrows = this.rows;
            return allrows;
        },

        GetRow: function(func)
        {
            return this.rows.find(func);
        },

        RemoveRow: function(row)
        {
            var arr = this.options.data;
            var entry = null;
            for(var k=0; k < arr.length; k++)
            {
                if(arr[k] == row.data)
                {
                    entry = k;
                    break;
                }
            }
            
            if(entry !== null && typeof entry !== 'undefined')
            {
                this.options.data.splice(entry, 1);
                this.Reload();
            }
        },

        FitSize: function()
        {
            if(this.Validate(this.options.fitHeight))
            {
                if(this.options.fitHeight === true)
                {
                    var offset = this.element.offset();
                    var posY = offset.top - $(window).scrollTop();
                    var posX = offset.left - $(window).scrollLeft();

                    if($(window).height() < (this.initialHeight + posY+2*$(this.heading).height()))
                    {
                        var maxheight = $(window).height() - posY;                
                        $(this.body).css("max-height", ($(window).height() - posY - 2*$(this.heading).height()) );
                    } else {
                                    
                    }  
                    
                    if(HasScrollBar(this.body))
                    {
                        $(this.heading).css("padding-right", GetScrollBarWidth());
                    } else {
                        $(this.heading).css("padding-right", "0");
                    }
                }
            }            
        },

        CreateHeader: function()
        {
            // Create Header
            // ---
            var self = this;
            $(this.heading).html("");
            this.columnfields = [];
            
            if(this._generateheader && self.Validate(this.options.columns))
            {                        
                var row = $('<div class="jsst_row heading"></div>');
                $(this.heading).append(row);
                
                for(var j=0; j < this.options.columns.length; j++)
                {                
                    var col = this.options.columns[j];            
                    var column = {  
                        key: col.datafield                           
                    };

                    var hiddenclass = "";     
                    var isvisible = true;   
                    if(self.Validate(this.options.columns[j].visible))
                    {
                        if(this.options.columns[j].visible)
                        {
                            hiddenclass = "";
                            this.columnfields.push(this.options.columns[j].datafield);
                        } else {
                            isvisible = false;   
                            hiddenclass = " jsst_hiddencol";
                        }
                    } else {
                        this.columnfields.push(this.options.columns[j].datafield);
                    }

                    var addstyle = "";
                    if(self.Validate(this.options.columns[j].width))
                    {
                        var w = this.options.columns[j].width;
                        if(w.includes("px"))
                        {
                            addstyle = ' style="width: '+this.options.columns[j].width+'; flex: none;"';
                        } else if(w.includes("%"))  
                        {
                            addstyle = ' style="width: '+this.options.columns[j].width+'; flex: none;"';
                        }                                       
                    }

                    var sortableclass = "";
                    if(self.Validate(this.options.sortable))
                    {
                        if(this.options.sortable)
                        {
                            sortableclass = ' class="jsst_sortheader" id="jsst_sortheader_id'+j+'"';
                        }
                    }
                    
                    column.title = this.options.columns[j].title;                    
                    var cellvalue = this.options.columns[j].title;

                    var datefields_str = "";
                    if(self.Validate(this.options.columns[j].datafields))
                    {
                        var datafields = this.options.columns[j].datafields;
                        if(datafields.length > 0)
                        {
                            for(var f=0; f < datafields.length; f++)
                            {
                                datefields_str += ' ' + datafields[f].key + '="'+datafields[f].value+'" ';
                            }
                        }
                    }
                    
                    
                    //var span =  $('<span'+sortableclass+datefields_str+'>'+cellvalue+'</span>');
                    var span =  $('<span'+sortableclass+datefields_str+' style="font-size: '+this.options.headerfontsize+';">'+cellvalue+'</span>');

                    // Sort Icon
                    if(this.options.sortable)
                    {
                        $(span).html($(span).html() + '<i class="material-icons jsst_ordericon">unfold_more</i>');
                        
                        //$(span).click(function(e) {
                        var icon = $(span).children('.jsst_ordericon')[0];
                        //$(icon).click(function(e) {
                        $(icon).on("click", function(e) {
                            var targ = e.target.id;
                            //console.log("targ: "+targ);
                            var lastChar = targ.charAt(targ.length - 1);
                            e.preventDefault();
                            
                            //console.log("this.parentElement: ");
                            //console.log(this.parentElement);
                            self.SortTableByColumn(lastChar, this.parentElement);
                        });
                    }                                        
                    
                    var cell = $('<div id="hd_'+column.key+'" class="jsst_head'+hiddenclass+' jsst_noselect"'+addstyle+'></div>');
                    $(cell).html(span);
                    row.append(cell);

                    var x = cell.position().left;
                    self.headercells.push({column: column, html: cell, sx: 0, w: 0, order: j, visible: isvisible});

                    this.cols.push(column);
                }

                for(var p=0; p < row.children().length; p++)
                {
                    var child = row.children()[p];
                    for(var s=0; s < self.headercells.length; s++)
                    {
                        var key = "hd_"+self.headercells[s].column.key;
                        if(key === $(child).attr("id"))
                        {
                            self.headercells[s].sx = $(child).position().left;
                            self.headercells[s].w = $(child).width();
                            break;
                        }
                    }
                }                
            }
        },        
        // ---
        // End Create Header

        CreateData: function()
        {
            this.rows = [];

            // Create Data
            // ---
            var self = this;
            $(this.body).html("");
            if(self.Validate(this.options.data))
            {
                if(this.options.data.length > 0)
                {
                    for(var k=0; k < this.options.data.length; k++)
                    {
                        var rowclass = "odd";
                        if((k+1) % 2 == 0) rowclass = "even";

                        var row_element = $('<div class="jsst_row '+rowclass+'"></div>');
                        $(this.body).append(row_element);

                        for(var g=0; g < this.options.columns.length; g++)
                        {
                            var found_column_data = false;
                            var mainkey = this.options.columns[g].datafield;

                            var hiddenclass = " jsst_hiddencol";
                            if(this.columnfields.length > 0)
                            {                                
                                for(var p=0; p < this.columnfields.length; p++)
                                {                                
                                    if(mainkey === this.columnfields[p])
                                    {
                                        hiddenclass = "";
                                        break;
                                    }
                                }
                            }

                            var addstyle = "";
                            if(self.Validate(this.options.columns[g].width))
                            {
                                var w = this.options.columns[g].width;
                                if(w.includes("px"))
                                {
                                    addstyle = ' style="width: '+this.options.columns[g].width+'; flex: none;"';
                                } else if(w.includes("%"))  
                                {
                                    addstyle = ' style="width: '+this.options.columns[g].width+'; flex: none;"';
                                }                               
                            }

                            for (var key in this.options.data[k])
                            {
                                var cellvalue = this.options.data[k][key];                            
                                if(this.options.columns[g].datafield === key)
                                {
                                    found_column_data = true;
                                    if(self.Validate(this.options.columns[g].view))
                                    {
                                        cellvalue = this.options.columns[g].view(this.options.data[k], row_element);                                
                                    }

                                    var cell = $('<div class="jsst_cell'+hiddenclass+'"'+addstyle+'><span style="font-size: '+this.options.cellfontsize+'">'+cellvalue+'</span></div>');
                                    row_element.append(cell);

                                    break;
                                }
                            }
                    
                            if(!found_column_data)
                            {
                                var cell = $('<div class="jsst_cell'+hiddenclass+'"'+addstyle+'><span>&nbsp;</span></div>');
                                row_element.append(cell);
                            }
                        }

                        row_element.data("values", this.options.data[k]);

                        this.rows.push({element: row_element, data: this.options.data[k]});
                    }

                    if(this._generateheader)
                    {
                        if(this.Validate(this.options.bodyheight))
                        {
                            $(this.body).css("max-height", this.options.bodyheight - $(this.heading).height() );
                        }

                        if(this.Validate(this.options.scrollable))
                        {
                            if(this.options.scrollable === true)
                            {
                                $(this.body).addClass("jsst_scrollbody");

                                if(HasScrollBar(this.body))
                                {
                                    $(this.heading).css("padding-right", GetScrollBarWidth());
                                }
                            }                            
                        }
                    }
                } else {
                    var nodatatxt = "No data available";
                    if(this.Validate(this.options))
                    {
                        if(this.Validate(this.options.nodatatext))
                        {
                            nodatatxt = this.options.nodatatext;
                        }
                    }
                    
                    Notify(this, nodatatxt);
                }            
            } else {
                var nodatatxt = "No data available";
                if(this.Validate(this.options))
                {
                    if(this.Validate(this.options.nodatatext))
                    {
                        nodatatxt = this.options.nodatatext;
                    }
                }
                
                Notify(this, nodatatxt);
            }            
        },
        // ---
        // End Create Data

        SortTableByColumn(n, caller) {
            if(this.options.sortable)
            {
                if(this.listeners.BeforeSort !== null && typeof this.listeners.BeforeSort !== 'undefined' && typeof this.listeners.BeforeSort === "function")
                {
                    this.listeners.BeforeSort();
                }            

                //var table = $(caller).parent().parent().parent();
                var dir = "asc";
                var dir_value = 1;

                var icon_element = $(caller).children(".jsst_ordericon")[0];                    
                if($(icon_element).html() === "expand_more")
                {
                    dir = "desc";
                    dir_value = -1;
                
                } else {
                    dir = "asc";
                    dir_value = 1;
                }

                // Change all Icons to default
                if($(this.heading).children() !== null && typeof $(this.heading).children() !== 'undefined')
                {
                    var child_heading = $(this.heading).children()[0];
                    for(var f=0; f < $(child_heading).children().length; f++)
                    {
                        var child = $(child_heading).children()[f];
                        var child_sortheader = $(child).children(".jsst_sortheader")[0];
                        var child_icon_element = $(child_sortheader).children(".jsst_ordericon")[0];
                        $(child_icon_element).html("unfold_more");
                    }
                }

                if (dir === "asc") {
                    $(icon_element).html("expand_more");
                }  else if (dir === "desc") {
                    $(icon_element).html("expand_less");
                }

                var id = $(caller).parent().attr('id');
                var column_param = id.replace("hd_","");

                function compare( a, b ) {
                    if ( a[column_param] < b[column_param] ){
                    return -1 * dir_value;
                    }
                    if ( a[column_param] > b[column_param] ){
                    return 1 * dir_value;
                    }
                    return 0;
                }

                this.options.data.sort( compare );
                this.Reload();

                if(this.listeners.OnSort !== null && typeof this.listeners.OnSort !== 'undefined' && typeof this.listeners.OnSort === "function")
                {
                    this.listeners.OnSort();
                }
            } 
        },
        // ---
        // End SortTableByColumn
    };    

    var HasScrollBar = function(target)
    {
        return target.get(0).scrollHeight > target.height();
    };

    var Notify = function(target, text)
    {
        var datafields_str ="";
        if(target.options !== null && typeof target.options !== 'undefined')
        {
            if(target.options.nodata_datafields !== null && typeof target.options.nodata_datafields !== 'undefined')
            {
                var datafields = target.options.nodata_datafields;
                if(datafields.length > 0)
                {
                    for(var f=0; f < datafields.length; f++)
                    {
                        datafields_str += ' ' + datafields[f].key + '="'+datafields[f].value+'" ';
                    }
                }
            }
        }
        
        $(target.body).html('<div class="emptytable"'+datafields_str+'>'+text+'</div>');
    };

    var ThrowError = function(target, error)
    {        
        if(target.Validate(target.listeners))
        {
            if(target.Validate(target.listeners.OnError))
            {
                if(typeof target.listeners.OnError === "function")
                {
                    target.listeners.OnError(error);
                }
            }
        }        
    };

    var GetScrollBarWidth = function() {
        var $outer = $('<div>').css({visibility: 'hidden', width: 100, overflow: 'scroll'}).appendTo('body'),
            widthWithScroll = $('<div>').css({width: '100%'}).appendTo($outer).outerWidth();
        $outer.remove();
        return 100 - widthWithScroll;
    };
    
    $.fn[pluginName] = function (options) {

        var plugin = this.data(dataKey);

        // has plugin instantiated ?
        if (plugin instanceof JSSteelTable) {
            // if have options arguments, call plugin.init() again
            if (typeof options !== 'undefined') {
                plugin.init(options);
            }
        } else {
            plugin = new JSSteelTable(this, options);
            this.data(dataKey, plugin);
        }
        
        return plugin;
    };

}(jQuery, window, document));