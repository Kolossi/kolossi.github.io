# Bookmarks
{::options parse_block_html="true" /}

{% for thing in site.bookmarks %}
    {% assign logo-filename = thing.logo-name %}
    {% unless logo-filename %}
        {% assign logo-filename = thing.title | downcase | append: '.png'%}
    {% endunless %}
<div class='bookmark-loz'>
[![{{thing.title}}]({{site.url}}/assets/{{logo-filename}}) {{thing.title}}]({{thing.target-url}})
</div>
{% endfor %}

