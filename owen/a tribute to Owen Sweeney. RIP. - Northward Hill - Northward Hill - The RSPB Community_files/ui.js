(function($)
{
	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	var showOptions = function(context)
	{
		hideSearch(context);
		context.optionsPopup.glowPopUpPanel('show', context.optionsLink);
		context.optionsLink.addClass('active active__internal-link active__internal-link__search-options active__search-options');
	},
	hideOptions = function(context)
	{
		hideSearch(context);
		context.optionsPopup.glowPopUpPanel('hide');
		context.optionsLink.removeClass('active active__internal-link active__internal-link__search-options active__search-options');
	},
	hideSearch = function(context)
	{
		context.searchResultsPopup.glowPopUpPanel('hide');
	},
	showLoading = function(context)
	{
		context.searchResultsPopup.glowPopUpPanel('html', '<div class="message loading loading__message">' + context.loading + '</div>');

		if (context.searchResultsPopup.glowPopUpPanel('isShown'))
		{
			context.searchResultsPopup.glowPopUpPanel('refresh');
		}
		else
		{
			context.searchResultsPopup.glowPopUpPanel('show', context.query);
		}
	},
	search = function(context)
	{
		$.telligent.evolution.get({
			url: context.searchUrl,
			data: {
				w_searchText: context.query.val(),
				w_groupId:  context.groupId
			},
			success: function(response)
			{
				context.searchResultsPopup.glowPopUpPanel('html', response);
				if (context.searchResultsPopup.glowPopUpPanel('isShown'))
				{
					context.searchResultsPopup.glowPopUpPanel('refresh');
				}
				else
				{
					context.searchResultsPopup.glowPopUpPanel('show', context.query);
				}
			},
			defaultErrorMessage: context.error,
			error: function(xhr, desc, ex)
			{
				context.searchResultsPopup.glowPopUpPanel('html', '<div class="message error error__message">' + desc + '</div>');
			}
		});
	},
	checkForSearchQueryChange = function(context)
	{
		clearTimeout(context.changeTimeout);

		var value = context.query.val();
		if (value !== context.lastQuery)
		{
			context.lastQuery = value;
			context.lastKeyCode = -1;

			clearTimeout(context.searchTimeout);

			if (context.lastQuery.length > 0)
			{
				context.query.removeClass('empty');
				showLoading(context);
				context.searchTimeout = setTimeout(function() { search(context); }, 499);
			}
			else
			{
				context.query.addClass('empty');
				hideSearch(context);
			}
		}

		context.changeTimeout = setTimeout(function() { checkForSearchQueryChange(context); }, 99);
	};

	$.telligent.evolution.widgets.siteSearch = {
		register: function(context) {
			context.searchResultsPopup = $('<div></div>').glowPopUpPanel({
				cssClass: 'menu search-content results menu__results menu__search-content menu__results__search-content results__search-content',
				position: 'downright',
				zIndex: 1000,
				hideOnDocumentClick: true
			});

			if (context.optionsLink.length > 0 && context.optionsContent.length > 0)
			{
				context.optionsPopup = context.optionsContent.show().glowPopUpPanel({
					cssClass: 'menu search-content options menu__options menu_search-content menu__options__search-content options__search-content',
					position: 'downleft',
					zIndex: 1000,
					hideOnDocumentClick: false
				})
					.bind('glowPopUpPanelMouseOver', function() { context.mouseInOptionsPopup = true; })
					.bind('glowPopUpPanelMouseOut', function() { context.mouseInOptionsPopup = false; });

				context.optionsLink.click(function()
				{
					if (!context.optionsPopup.glowPopUpPanel('isShown'))
					{
						showOptions(context);
					}
					else
					{
						hideOptions(context);
					}

					return false;
				});

				context.optionsPopup.glowPopUpPanel('children').find('input[name="' + context.filterName + '"]').click(function()
				{
					hideOptions(context);
					if ($(this).is(':checked'))
					{
						context.groupId = $(this).val();
					}
					context.query.focus();
				}).filter(':[value="' + context.groupId + '"]').attr('checked', true);
			}

			context.query
				.attr('autocomplete', 'off')
				.keydown(function(e)
				{
					if (e.keyCode === 13)
					{
						clearTimeout(context.searchTimeout);

						var selectedLink = context.searchResultsPopup.glowPopUpPanel('children').find('a.selected');
						if (selectedLink.length > 0)
						{
							window.location = selectedLink.first().attr('href');
						}
						else
						{
							var params = { q: context.query.val() };
							
							if (context.groupId > 0)
							{
								params.group = context.groupId;
							}
							
							window.location = context.searchResultsUrl.replace(/\{0\}/gi, $.param(params)).replace(/\+/gi, '%20').replace(/'/gi, '%27');
						}

						hideSearch(context);
						context.query.blur();
						return false;
					}
					else if (e.keyCode === 38)
					{
						// up
						var previousNode = null;
						context.searchResultsPopup.glowPopUpPanel('children').find('a').each(function()
						{
							if ($(this).hasClass('selected'))
							{
								$(this).removeClass('selected');
								if (previousNode)
								{
									$(previousNode).addClass('selected');
								}

								return false;
							}
							else
							{
								previousNode = this;
							}
						});

						return false;
					}
					else if (e.keyCode === 40)
					{
						// down
						var selectNext = false;
						var done = false;
						context.searchResultsPopup.glowPopUpPanel('children').find('a').each(function()
						{
							if ($(this).hasClass('selected'))
							{
								selectNext = true;
								$(this).removeClass('selected');
							}
							else if (selectNext)
							{
								$(this).addClass('selected');
								done = true;
								return false;
							}
						});

						if (!done)
						{
							if (selectNext)
							{
								context.searchResultsPopup.glowPopUpPanel('children').find('a').last().addClass('selected');
							}
							else
							{
								context.searchResultsPopup.glowPopUpPanel('children').find('a').first().addClass('selected');
							}
						}

						return false;
					}
				})
				.focus(function()
				{
					if(!$(this).hasClass('empty'))
					{
						context.lastKeyCode = -1;
						clearTimeout(context.searchTimeout);
						search(context);
					}

					clearTimeout(context.changeTimeout);
					context.changeTimeout = setTimeout(function() { checkForSearchQueryChange(context); }, 99);
				})
				.blur(function()
				{
					clearTimeout(context.searchTimeout);
					clearTimeout(context.changeTimeout);
				});

			$(document).click(function()
			{
				if (context.optionsPopup && context.optionsPopup.glowPopUpPanel('isShown') && !context.mouseInOptionsPopup)
				{
					hideOptions(context);
				}
			});
		}
	};
}(jQuery));
