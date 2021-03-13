/*
* JSIronTable - Copyright 2020 Raftopoulos Yannis
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

    var pluginName = "JSIronTable",
        dataKey = "plugin_" + pluginName;

    var JSIronTable = function (element, options) {
    
        this.element = element;
        
        this.options = {
            data: [],
            fitHeight: false,
            maxHeight: 0,
            fixedheader: true,
            scrollable: true,
            sortable: false,
            draggableColumns: false,
            headerfontsize: "12pt",
            cellfontsize: "12pt",
            columns: [],
            rows: [],
            headercells: [],
            columnfields: []
        };
        
        this.init(options);
    };

    JSIronTable.prototype = {
        init: function (options) {
            $.extend(this.options, options);
            
            var self = this;
            this.body = $('<div class="jsit_body"></div>');
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
            this.columns = [];
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
                        
                        if(self.Validate(options.columns))
                        {
                            self.options.columns = self.ExpandDynamicColumns(options);

                            if(self._generateheader)
                            {
                                if($(self.element).find('.jsit_heading').length !== 0)
                                {
                                    $(self.element).find('.jsit_heading').remove();                                
                                }
                                
                                self.heading = $('<div class="jsit_heading"></div>');
                                self.element.prepend(self.heading);
            
                                if(self.Validate(options.fixedheader))
                                {
                                    if(options.fixedheader)
                                    {
                                        $(self.heading).addClass("jsit_fixedheader");
                                    }
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
                            console.log("JSIronTable Error creating Header: "+ex);
                        }
                        
        
                        // Create Data
                        //
                        try
                        {
                            self.CreateData();
                        } catch(ex)
                        {
                            console.log("JSIronTable Error creating Data: "+ex);
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
            if(this.options.debug) console.log("JSIronTable -> OnInitialized()");
            if(this.listeners.OnError !== null && typeof this.listeners.OnError !== 'undefined')
            {
                this.listeners.OnInitialized = callback;
            }            
        },

        OnError(callback)
        {
            if(this.options.debug) console.log("JSIronTable -> OnError()");
            if(this.listeners.OnError !== null && typeof this.listeners.OnError !== 'undefined')
            {
                this.listeners.OnError = callback;
            }            
        },

        OnSort(callback)
        {
            if(this.options.debug) console.log("JSIronTable -> OnSort()");
            if(this.listeners.OnSort !== null && typeof this.listeners.OnSort !== 'undefined')
            {
                this.listeners.OnSort = callback;
            }
            
        },

        BeforeSort(callback)
        {
            if(this.options.debug) console.log("JSIronTable -> BeforeSort()");
            if(this.listeners.BeforeSort !== null && typeof this.listeners.BeforeSort !== 'undefined')
            {
                this.listeners.BeforeSort = callback;
            }            
        },

        OnReload(callback)
        {
            if(this.options.debug) console.log("JSIronTable -> OnReload()");
            if(this.listeners.OnReload !== null && typeof this.listeners.OnReload !== 'undefined')
            {
                this.listeners.OnReload = callback;
            }            
        },

        ExpandDynamicColumns: function(options)
        {
            var columns = []
            if (!this.Validate(options.columns)) return columns;

            for(var j=0; j < this.options.columns.length; j++)
            {
                var col = options.columns[j];
                if (!this.Validate(col)) continue;

                if (!this.Validate(col.fromUniqueValues))
                {
                    columns.push(col);
                    continue;
                }

                if (!this.Validate(options.data))
                {
                    var newcol = Object.assign({},col);
                    newcol.datafield = newcol.fromUniqueValues.datafield;
                    delete newcol.fromUniqueValues;
                    columns.push(newcol);
                    continue;
                }

                var collookup = {};
                var colorder = [];

                for(var d=0; d < this.options.data.length; d++)
                {
                    var item = options.data[d];
                    var val = item[col.fromUniqueValues.datafield]
                    if (val in collookup) continue;
                    var newcol = Object.assign({},col);
                    newcol.datafield = newcol.fromUniqueValues.datafield;
                    newcol.dataValue = val;
                    newcol.title = val;
                    delete newcol.fromUniqueValues;
                    collookup[val]=newcol;
                    colorder.push(val);
                }

                if (this.Validate(col.fromUniqueValues.sortCompare))
                {
                    colorder.sort(col.fromUniqueValues.sortCompare)
                }

                newcolumns=colorder.map(function(key) { return collookup[key];});

                columns=columns.concat(newcolumns);
            } 

            return columns;
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
            $(this.body).html('<div class="jsit_loader_container"><div class="jsit_loader"></div></div>');
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
                var row = $('<div class="jsit_row heading"></div>');
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
                            hiddenclass = " jsit_hiddencol";
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
                            sortableclass = ' class="jsit_sortheader" id="jsit_sortheader_id'+j+'"';
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
                        $(span).html($(span).html() + '<i class="material-icons jsit_ordericon">unfold_more</i>');
                        
                        //$(span).click(function(e) {
                        var icon = $(span).children('.jsit_ordericon')[0];
                        //$(icon).click(function(e) {
                        $(icon).on("click", function(e) {
                            var targ = e.target.id;
                            console.log("targ: "+targ);
                            var lastChar = targ.charAt(targ.length - 1);
                            e.preventDefault();
                            
                            console.log("this.parentElement: ");
                            console.log(this.parentElement);
                            self.SortTableByColumn(lastChar, this.parentElement);
                        });
                    }                                        
                    
                    var divId = 'hd_'+column.key;
                    if (self.Validate(col.dataValue))
                    {
                        divId += '_'+self.EncodeForHtmlId(col.dataValue);
                    }
                    var cell = $('<div id="'+divId+'" class="jsit_head'+hiddenclass+' jsit_noselect"'+addstyle+'></div>');
                    $(cell).html(span);
                    row.append(cell);

                    //self.addDragEvent(cell);
                    addDragEvent(cell, self);

                    var x = cell.position().left;
                    self.headercells.push({column: column, html: cell, sx: 0, w: 0, order: j, visible: isvisible});
                    
                    // Drag Cell Size
                    //
                    // /createDraggable(cell, this, j);
                    

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

        EncodeForHtmlId: function(sourceValue)
        {
            // thanks: https://stackoverflow.com/a/43693571/2738122
            return encodeURIComponent(sourceValue).toLowerCase().replace(/\.|%[0-9a-z]{2}/gi, '');
        },

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
                    var data;
                    if (self.Validate(this.options.rowPerUniqueValue) && self.Validate(this.options.rowPerUniqueValue.datafield))
                    {
                        var datalookup = {};
                        var dataorder = [];

                        for(var d=0; d < this.options.data.length; d++)
                        {
                            var item = options.data[d];
                            var val = item[this.options.rowPerUniqueValue.datafield]
                            if (val in datalookup) continue;
                            var items = this.options.data.filter(o => o[this.options.rowPerUniqueValue.datafield]===val);
                            datalookup[val]=items;
                            dataorder.push(val);
                        }

                        if (self.Validate(this.options.rowPerUniqueValue.sortCompare))
                        {
                            dataorder.sort(this.options.rowPerUniqueValue.sortCompare)
                        }

                        data=dataorder.map(function(key) { return datalookup[key];});
                    }
                    else
                    {
                        data = this.options.data;
                    }
                    
                    for(var k=0; k < data.length; k++)
                    {
                        var rowclass = "odd";
                        if((k+1) % 2 == 0) rowclass = "even";

                        var row_element = $('<div class="jsit_row '+rowclass+'"></div>');
                        $(this.body).append(row_element);

                        for(var g=0; g < this.options.columns.length; g++)
                        {
                            var col = this.options.columns[g];
                            var found_column_data = false;
                            var mainkey = col.datafield;

                            var hiddenclass = " jsit_hiddencol";
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
                            if(self.Validate(col.width))
                            {
                                var w = col.width;
                                if(w.includes("px"))
                                {
                                    addstyle = ' style="width: '+col.width+'; flex: none;"';
                                } else if(w.includes("%"))  
                                {
                                    addstyle = ' style="width: '+col.width+'; flex: none;"';
                                }                               
                            }

                            /// %%%% cope with array of data items in here
                            
                            var celldata;
                            if (self.Validate(this.options.rowPerUniqueValue) && self.Validate(this.options.rowPerUniqueValue.datafield))
                            {
                                if (col.datafield === this.options.rowPerUniqueValue.datafield)
                                {
                                    celldata = [data[k][0]];
                                }
                                else
                                {
                                    celldata = data[k];
                                }
                            }
                            else
                            {
                                celldata = [data[k]];
                            }

                            var cellvalues = [];
                            for(var c=0; c < celldata.length; c++)
                            {
                                var celldataitem = celldata[c];
                                var itemvalue;
                                for (var key in celldataitem)
                                {
                                    itemvalue = celldataitem[key];                            
                                    if(col.datafield === key
                                        && (!self.Validate(col.dataValue) || itemvalue === col.dataValue))
                                    {
                                        found_column_data = true;
                                        if(self.Validate(col.view))
                                        {
                                            itemvalue = col.view(celldataitem, row_element);                                
                                        }
                                        cellvalues.push(itemvalue);
                                        break;
                                    }
                                }
                            }
                            /// %%%% end of cope with array

                            var cellstyle = '';
                            var cellvalue;
                    
                            if(found_column_data)
                            {
                                cellstyle = ' style="font-size: '+this.options.cellfontsize+'"';
                                if (self.Validate(col.combineValues))
                                {
                                    cellvalue = col.combineValues(cellvalues);
                                }
                                else
                                {
                                    cellvalue = cellvalues.join();
                                }
                            }
                            else
                            {
                                cellvalue = "&nbsp;";
                            }

                            var cell = $('<div class="jsit_cell'+hiddenclass+'"'+addstyle+'><span'+cellstyle+'>'+cellvalue+'</span></div>');
                                  
                            row_element.append(cell);
                        }
                        row_element.data("values", celldata);

                        this.rows.push({element: row_element, data: celldata});
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
                                $(this.body).addClass("jsit_scrollbody");

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
                if(!$(caller).hasClass("dragging"))
                {
                    if(this.listeners.BeforeSort !== null && typeof this.listeners.BeforeSort !== 'undefined' && typeof this.listeners.BeforeSort === "function")
                    {
                        this.listeners.BeforeSort();
                    }            

                    //var table = $(caller).parent().parent().parent();
                    var dir = "asc";
                    var dir_value = 1;

                    var icon_element = $(caller).children(".jsit_ordericon")[0];                    
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
                            var child_sortheader = $(child).children(".jsit_sortheader")[0];
                            var child_icon_element = $(child_sortheader).children(".jsit_ordericon")[0];
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

    var addDragEvent = function(cell, table)
    {
        if(table.options.draggableColumns)
        {
            $( cell ).draggable(
            { 
                axis: "x",
                containment: "parent",
                start: function(ev,ui) {
                    this.ax = $(ev.target).position().left;
                },
                drag: function(ev,ui) {
                    $(ev.target).addClass("dragging");            
                },
                stop: function(ev,ui) {        
                    setTimeout(function()
                    {
                        $(ev.target).removeClass("dragging");
                    }, 500);
    
                    var a_x = -1;
                    var a_index = -1;
                    var b_x = -1;
                    var b_index = -1;
                    
                    a_x = $(ev.target).position().left;

                    console.log("Diff: "+Math.abs(a_x - this.ax));
                    var move_diff = Math.abs(a_x - this.ax);

                    if(move_diff > 40)
                    {
                        var headercells = $(ev.target).parent().children(".jsit_head");
                        for(var j=0; j < headercells.length; j++)
                        {
                            var currentheader = headercells[j];
                            var currentheader_x = $(currentheader).position().left;
                            var currentheader_w = $(currentheader).outerWidth();
                            
                            if((a_x >= currentheader_x) && a_x < (currentheader_x + currentheader_w) && $(ev.target).attr("id") != $(currentheader).attr('id'))
                            {
                                var resulttable = ExchangeColumns($(ev.target).attr("id"), $(currentheader).attr('id'), table); 
                                table = resulttable;
                                break;
                            }
                        }
                    }
                    
                    
    
                    $(this).css({left: 0});
                }
            });
        }
        

        return table;
    };
    
    var ExchangeColumns = function(sourceColumnA, targetColumnB, table)
    {
        var a_index = -1;
        var b_index = -1;

        for(var j=0; j < table.options.columns.length; j++)
        {
            if("hd_"+table.options.columns[j].datafield == sourceColumnA)
            {
                a_index = j;
            } else 
            if("hd_"+table.options.columns[j].datafield == targetColumnB)
            {
                b_index = j;
            }
        }

        /* console.log("a_index: "+a_index);
        console.log("b_index: "+b_index);
        console.log(table.options.columns); */

        var temp_column = table.options.columns[a_index];
        table.options.columns[a_index] = table.options.columns[b_index];
        table.options.columns[b_index] = temp_column;

        table.ReloadAll();

        return table;
    }
/*
    var ExchangeColumns = function(sourceColumnA, targetColumnB, table)
    {
        console.log("ExchangeColumns");
        var a_index = -1;
        var b_index = -1;
        for(var j=0; j < table.cols.length; j++)
        {
            if("hd_"+table.cols[j].key == sourceColumnA)
            {
                a_index = j;
            } else 
            if("hd_"+table.cols[j].key == targetColumnB)
            {
                b_index = j;
            }
        }

        if(a_index != -1 & b_index != -1)
        {
            var temp = table.cols[a_index];
            table.cols[a_index] = table.cols[b_index];
            table.cols[b_index] = temp;
        }

        var a_html = null;
        var b_html = null;
        var a_html_index = -1;
        var b_html_index = -1;

        $('.jsit_row.heading').children('div').each(function () {
            if($(this).attr("id") === sourceColumnA)
            {
                a_html = this;
                a_html_index = $(this).index();
            } else if($(this).attr("id") === targetColumnB)
            {
                b_html = this;
                b_html_index = $(this).index();
            }
        });

        if(a_html !== null && b_html !== null && a_html_index != -1 & b_html_index != -1)
        {
            // Exchange Heading
            $(a_html).css({left: 0});
            $(b_html).css({left: 0});
            var temp_a = $(a_html).clone();
            var temp_b = $(b_html).clone();
            $(a_html).replaceWith(temp_b);    
            $(b_html).replaceWith(temp_a);

            // Add Listener for B
            var sortheader_b = $(temp_b).children('.jsit_sortheader');            
            if(sortheader_b !== null && typeof sortheader_b !== 'undefined')
            {                
                var icon_b = $(sortheader_b[0]).children('.jsit_ordericon')[0];
                $(icon_b).on('click', function(e) {
                    var targ = e.target.id;
                    var lastChar_b = targ.charAt(targ.length - 1);
                    console.log("this.parentElement: ");
                    console.log(this.parentElement);
                    e.preventDefault();                    
                    table.SortTableByColumn(lastChar_b, this.parentElement);
                });
            }

            // Add Listener for A
            var sortheader_a = $(temp_a).children('.jsit_sortheader');            
            if(sortheader_a !== null && typeof sortheader_a !== 'undefined')
            {                
                var icon_a = $(sortheader_a[0]).children('.jsit_ordericon')[0];
                $(icon_a).on('click', function(e) {
                    var targ = e.target.id;
                    var lastChar = targ.charAt(targ.length - 1);
                    console.log("this.parentElement: ");
                    console.log(this.parentElement);
                    e.preventDefault();                    
                    table.SortTableByColumn(lastChar, this.parentElement);
                });
            }
            

            table = addDragEvent($(temp_a), table);
            table = addDragEvent($(temp_b), table);

            for(var k=0; k < $('.jsit_body').children('.jsit_row').length; k++)
            {
                var item = $('.jsit_body').children('.jsit_row')[k];
                var cell_a = $(item).children('.jsit_cell')[a_html_index];
                var cell_b = $(item).children('.jsit_cell')[b_html_index];
                
                var temp_content_a = $(cell_a).clone();
                var temp_content_b = $(cell_b).clone();

                $(cell_a).replaceWith(temp_content_b);    
                $(cell_b).replaceWith(temp_content_a);         
            }
        }    

        return table;
    }*/

    var GetScrollBarWidth = function() {
        var $outer = $('<div>').css({visibility: 'hidden', width: 100, overflow: 'scroll'}).appendTo('body'),
            widthWithScroll = $('<div>').css({width: '100%'}).appendTo($outer).outerWidth();
        $outer.remove();
        return 100 - widthWithScroll;
    };
    
    $.fn[pluginName] = function (options) {

        var plugin = this.data(dataKey);

        // has plugin instantiated ?
        if (plugin instanceof JSIronTable) {
            // if have options arguments, call plugin.init() again
            if (typeof options !== 'undefined') {
                plugin.init(options);
            }
        } else {
            plugin = new JSIronTable(this, options);
            this.data(dataKey, plugin);
        }
        
        return plugin;
    };

}(jQuery, window, document));