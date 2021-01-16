# Kolossi

## Articles

{% for thing in site.articles %}
* [{{thing.title}}]({{thing.url}})
{% endfor %}


## Some quick tips

{% for thing in site.quicktips %}
* [{{thing.title}}]({{thing.url}})
{% endfor %}