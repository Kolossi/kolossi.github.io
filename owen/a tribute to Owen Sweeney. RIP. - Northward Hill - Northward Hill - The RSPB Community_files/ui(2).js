(function($){

	if (typeof $.telligent === 'undefined') { $.telligent = {}; }
	if (typeof $.telligent.evolution === 'undefined') { $.telligent.evolution = {}; }
	if (typeof $.telligent.evolution.widgets === 'undefined') { $.telligent.evolution.widgets = {}; }

	var errorHtml = '<div class="message error">{ErrorText}</div>',
		loadingHtml = '<div class="message loading">{LoadingText}</div>',
		load = function(context, rebasePager) {
			var data = { w_baseUrl: context.baseUrl };
			if(rebasePager) {
				data[context.pageIndexQueryStringKey] = 1;

				var hashData = $.telligent.evolution.url.hashData();
				hashData[context.pageIndexQueryStringKey] = 1;
				$.telligent.evolution.url.hashData(hashData);
			}
			setContent(context, loadingHtml.replace(/\{LoadingText\}/g, context.loadingText));
			$.telligent.evolution.get({
				url: context.loadCommentsUrl,
				data: data,
				success: function(response) {
					if(response) {
						setContent(context, response);
					}
				},
				defaultErrorMessage: context.errorText,
				error: function(xhr, desc, ex) {
					setContent(context, errorHtml.replace(/\{ErrorText\}/g, desc));
				}
			});
		},
		attachHandlers = function(context) {
			$(context.wrapper).bind('evolutionModerateLinkClicked',function(e) {
				var commentId = $(e.target).closest('.content-item').data('commentid');
				deletePostComment(context, context.blogId, context.blogPostId, commentId, e);
				return false;
			});
		},
		setContent = function(context, html) {
			context.wrapper.html(html).css("visibility", "visible");
		},
		deletePostComment = function(context, blogId, blogPostId, commentId, event) {
			if(confirm(context.deleteVerificationText)) {
				$.telligent.evolution.del({
					url: $.telligent.evolution.site.getBaseUrl() + 'api.ashx/v2/blogs/{BlogId}/posts/{BlogPostId}/comments/{CommentId}.json',
					data: {
						BlogId: blogId,
						BlogPostId: blogPostId,
						CommentId: commentId
					},
					success: function(response) {
						var item = $(event.target).closest('li.content-item');
						var remainingItems = $(event.target).closest('ul').find('li.content-item');
						item.slideUp(function() {
							item.remove();
							// if there were no more comments, hide the comments list altogether
							if(context.wrapper.find('li').length === 0) {
								context.wrapper.css("visibility", "hidden");
							}
							load(context, remainingItems.length === 1)
						});
					}
				});
			}
		};

	$.telligent.evolution.widgets.blogFeedbackList = {
		register: function(context) {
            attachHandlers(context);

			$(document).bind('telligent_blogs_commentposted', function(e, message) {
				load(context);
			});
		}
	};

})(jQuery);