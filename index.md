# Kolossi

## Articles

{% for article in site.articles %}
* [{{article.title}}]({{article.url}})
{% endfor %}


## Some quick tips

{% for quicktip in site.quicktips %}
* [{{quicktip.title}}]({{quicktip.url}})
{% endfor %}