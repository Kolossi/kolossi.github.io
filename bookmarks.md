# Bookmarks

{% for thing in site.bookmarks %}
* [![{{thing.title}}]({{site.url}}/assets/{{thing.title}}.png) {{thing.title}}]({{thing.target-url}})
{% endfor %}

