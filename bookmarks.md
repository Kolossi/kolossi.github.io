# Bookmarks

{% for thing in site.bookmarks %}
* [![{{thing.title}}]({{thing.title}}.png) {{thing.title}}]({{thing.target-url}})
{% endfor %}

