(function($)
{
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	var refreshList = function(context, list, isParent)
	{
		var moreHtml = $('<div class="content-list-header"></div><ul class="content-list"></ul><div class="content-list-footer"></div>');

		var items = $('.navigation-item.entry', list);
		var viewMore = $('.internal-link.view-more', list);
		var totalItems = items.length;
		var itemCount = 0;

		items.hide().unbind().data('navigation-custom-managed', 'true');
		viewMore.unbind().parent().hide().data('navigation-custom-managed', 'true');

		var totalWidth = list.width() - viewMore.parent().outerWidth(true);
		$('li:not([navigation-custom-managed="true"])', list).each(function()
		{
			if ($(this).css('display') != 'none') {
				totalWidth -= $(this).outerWidth(true);
			}
		});

		var currentWidth = 0;
		var hasMore = false;
		items.each(function()
		{
			itemCount++;
			var thisWidth = $(this).outerWidth(true);

			if ((currentWidth + thisWidth < totalWidth) && hasMore === false)
			{
				$(this).show();
				currentWidth = currentWidth + thisWidth;
			}
			else
			{
				hasMore = true;
				var e = $(this).clone();
				if (itemCount === totalItems)
				{
					e.addClass("last");
				}

				moreHtml.filter('ul.content-list').append(e.show());
			}
		});

		if (hasMore) {
			viewMore.parent().show();
		}
		else
		{
			viewMore.parent().hide();
		}

		attachHandlersToList(context, list, moreHtml);
	},
	attachHandlersToList = function(context, list, moreHtml)
	{
		$('.navigation-item.entry.with-children a.internal-link.view-group, .navigation-item.last a.internal-link.view-more', list)
			.mouseover(function() {
				if (context.currentPopupElement === this)
				{
					return;
				}

				hidePopup(context);
				context.currentPopupElement = this;
				var element = this;
				var uniqueId = $(this).attr('id').split('_')[1];

				context.popupTimeout = setTimeout(function() { showNavigation(context, element, uniqueId, moreHtml); }, 499);
			})
			.mouseout(function() {
				if (context.currentPopupElement === this)
				{
					clearTimeout(context.popupTimeout);
					clearTimeout(context.popupHideTimeout);
					context.popupHideTimeout = window.setTimeout(function() { hidePopup(context); }, 149);
				}
			});
	},
	showNavigation = function(context, element, uniqueId, moreHtml)
	{
		if (uniqueId === 'More')
		{
			$(element).parent().addClass('active');
			context.popup.glowPopUpPanel('html', moreHtml);
			context.popup.glowPopUpPanel('show', $(element).parent());
		}
		else
		{
			if (context.childCache[uniqueId])
			{
				$(element).parent().addClass('active');
				context.popup.glowPopUpPanel('html', context.childCache[uniqueId]);
				context.popup.glowPopUpPanel('show', $(element).parent());
				return;
			}

			$.telligent.evolution.get({
				url: context.childrenUrl,
				data: { w_uniqueId: uniqueId },
				success: function(response)
				{
					if (context.currentPopupElement === element)
					{
						$(element).parent().addClass('active');

						var jq = $(response);
						var columnsCount = jq.find('.multiple-column-item').length;
						var columns = jq.filter('.multiple-column-list');
						if (columns.length > 0)
						{
							columns.attr('class', columns.attr('class').replace(/TOTAL/g, columnsCount));
						}

						context.childCache[uniqueId] = jq;
						context.popup.glowPopUpPanel('html', jq);
						context.popup.glowPopUpPanel('show', $(element).parent());
					}
				},
				defaultErrorMessage: context.error,
				error: function(xhr, desc, ex)
				{
					if (context.currentPopupElement === element)
					{
						context.popup.glowPopUpPanel('html', '<div class="message error error__message">' + desc + '</div>');
						context.popup.glowPopUpPanel('show', $(element).parent());
					}
				}
			});
		}
	},
	hidePopup = function(context)
	{
		if (context.currentPopupElement)
		{
			$(context.currentPopupElement).parent().removeClass('active');
		}

		clearTimeout(context.popupHideTimeout);
		clearTimeout(context.popupTimeout);
		context.currentPopupElement = null;
		context.popup.glowPopUpPanel('hide');
	};

	$.telligent.evolution.widgets.navigationCustom = {
		register: function(context) {

			context.childCache = {};

			context.popup = $('<div></div>').glowPopUpPanel({
				cssClass: 'menu group-navigation-content group-navigation-content__menu',
				position: 'down',
				zIndex: 1000,
				hideOnDocumentClick: false
			})
				.bind('glowPopUpPanelMouseOver', function() { clearTimeout(context.popupHideTimeout); })
				.bind('glowPopUpPanelMouseOut', function()
				 {
					clearTimeout(context.popupHideTimeout);
					context.popupHideTimeout = window.setTimeout(function() { hidePopup(context); }, 149);
				 })
				.glowPopUpPanel('html', '');

			$(document).ready(function()
			{
				refreshList(context, context.parentList, true);
			});

			$(window).resize(function()
			{
				var w = $(window).width();
				if (!context.lastWindowWidth || context.lastWindowWidth !== w)
				{
					context.lastWindowWidth = w;
					refreshList(context, context.parentList, true);
				}
			});
		}
	};
}(jQuery));
