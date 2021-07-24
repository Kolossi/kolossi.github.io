define(['jquery-1.9', 'plugins/jquery.appear'], function ($) {

    var Images = function (options) {
        this.setOptions(options);
    };

    Images.prototype = {
        options : {
            context : $('body'),
            data_img_src : 'data-img-src-',
            data_img_alt : 'data-img-alt',
            data_lazy_img : 'data-lazy-img',
            data_blank_img : 'data-img-blank',
            rsp_img_css : 'rsp-img',
            lazy_img_css : 'lazy-img',
            valid_img_attributes : ['class', 'id', 'title', 'name'],
            appear : {
                onscroll : true,
                x : 200,
                y: 200
            }
        },
        setOptions : function (options) {
            this.options = $.extend({}, this.options, options);
        },
        init : function () {
            var _this = this, timer;

            // Run for all images on the page now
            _this.switchImagesSrc();

            // Separate resize functions allows the context 'this' to be available in switchImagesSrc
            function onResizeComplete(){
                _this.switchImagesSrc();
            }

             // Run whenever the window is resized
            $(window).on('resize', function(){
                clearTimeout(timer);
                timer = setTimeout(onResizeComplete, 300);
            });
        },
        getCurrentImageWidth : function (img){
            return $(img).width();
        },
        isResponsiveDataSrcAttribute : function (attr){
            return (attr.indexOf(this.options.data_img_src) !== -1 );
        },
        getDataSrcWidth : function (attr){
            return parseInt(attr.replace(this.options.data_img_src,''));
        },
        getImageSrcSizes : function (img) {
            var attributes = img.attributes,
                attribute, array_sizes_attr = [];

            for (var i = 0; (attribute = attributes[i]) != null; i++) {
                attribute = attributes[i].name;
                if (this.isResponsiveDataSrcAttribute(attribute)) {
                    array_sizes_attr.push(this.getDataSrcWidth(attribute));
                }
            }
            return this.sortSrcSizes(array_sizes_attr);
        },
        sortSrcSizes : function (ar) {
            if (ar.length) {
                return ar.sort(function(a,b){return a - b;});
            }
            return false;
        },
        getClosestNumber : function (goal, ar) {
            var closest = false;
            $.each(ar, function(index, value){
                if (closest == false || Math.abs(value - goal) < Math.abs(closest - goal)) {
                    closest = value;
                }
            });
            return closest;
        },
        isWidthOverThreshold : function (width, arr_sizes) {
            return (arr_sizes.length && width >= arr_sizes[0]);
        },
        updateSrcToClosestWidth : function (img, width, arr_sizes) {
            var closest_width = this.getClosestNumber(width, arr_sizes), src_attr;
            if (closest_width) {
                img.setAttribute('src', img.getAttribute(this.options.data_img_src + closest_width));
                this.removedSmallestWidthAttributes(img, closest_width, arr_sizes);
            }
            var _this = this;
            $(img).bind('load', function() {
                $(img).removeClass(_this.options.lazy_img_css).unbind('load');
            });
        },
        removedSmallestWidthAttributes : function (img, closest_width, arr_sizes) {
            var src_attr;
            for (var i = 0; (src_attr = arr_sizes[i]) != null; i++) {
                if(src_attr <= closest_width) {
                    img.removeAttribute(this.options.data_img_src + src_attr);
                }
            }
        },
        hasImageTag : function (element) {
            return (element.tagName.toLowerCase() === 'img');
        },
        convertTagToImage : function (element) {
            var attributes = (element.attributes) ? element.attributes : $(element)[0].attributes,
                img, source;

            img = this.buildImage(
                element.getAttribute(this.options.data_blank_img),
                element.getAttribute(this.options.data_img_alt)
            );

            this.copyAttributesToImage(attributes, img);
            if (this.options.appear.onscroll) {
                $(img).addClass(this.options.lazy_img_css);
            }
            return img;
        },
        buildImage : function (source, alt) {
            var img = document.createElement("img");
            img.src = source;
            img.alt = (alt ? alt : '');
            return img;
        },
        copyAttributesToImage : function (attributes, img) {
            var attribute;
            for (var i = 0; (attribute = attributes[i]) != null; i++) {
                if (this.isValidImgAttribute(attribute.name) && attribute.value) {
                    if (attribute.name === 'class') {
                        //IE 6/7 doesn't register the class name changes with setAttribute
                        img.className = attribute.value;
                    } else {
                        img.setAttribute(attribute.name, attribute.value);
                    }
                }
            }
        },
        /*
        * create responsive images
        * options : {
        *    src : 'image init scr',
        *    alt : 'image alt title',
        *    sources : [
        *        [176, "src 1"],
        *        [208, "src 2"],
        *    ]
        * }
        */
        createResponsiveImage : function (options) {
            var _this = this,
                alt = (options.alt) ? options.alt : 'bbc programme image',
                sources = (options.sources) ? options.sources : false,
                image = $('<img class="' + this.options.rsp_img_css + '" alt="' + alt +'" src="' + options.src +'"/>');
            $.each(sources, function(index, source){
                image.attr(_this.options.data_img_src + source[0], source[1]);
            });
            return image;
        },
        isValidImgAttribute : function(attr) {
            return (this.isResponsiveDataSrcAttribute(attr) || this.isValidPossibleAttribute(attr));
        },
        isValidPossibleAttribute : function (attr) {
            return ($.inArray(attr, this.options.valid_img_attributes) !== -1);
        },
        switchImagesSrc : function (context) {
            var all_images = this.getContentResponsiveImages(context),
                _this = this;

            for (var i = 0; (img = all_images[i]) != null; i++) {
                all_images[i] = this.switchDiv2Img(img);
            }

            if (this.options.appear.onscroll) {
                this.addOnScrollHandler(context);
            } else {
                for (var i = 0; (img = all_images[i]) != null; i++) {
                    this.processImageSrc(img);
                }
            }
        },
        getContentResponsiveImages : function (context){
            var context = (context) ? context : this.options.context,
                images = $('.' + this.options.rsp_img_css, context);

            return (images.length) ? images : false;
        },
        switchDiv2Img: function(img) {
            if (!this.hasImageTag(img)) {
                var img_div = img;
                img = this.convertTagToImage(img_div);

                $(img_div).replaceWith($(img));
                /*IE sets image width and height attributes once its in DOM - remove this only after appending img to DOM */
                $(img).removeAttr("width").removeAttr("height");
            }
            return img;
        },
        addOnScrollHandler : function (context) {
            var _this = this;
            $('.' + this.options.rsp_img_css, context).appear(function() {
                _this.processImageSrc(this);
            },{
                accX: _this.options.appear.x,
                accY: _this.options.appear.y
            });
        },
        processImageSrc : function (img) {
            var current_width  = this.getCurrentImageWidth(img),
                arr_src_sizes = this.getImageSrcSizes(img);
            if (this.isWidthOverThreshold(current_width, arr_src_sizes)) {
                this.updateSrcToClosestWidth(img, current_width, arr_src_sizes);
            }
        }

    };
    return Images;
});
