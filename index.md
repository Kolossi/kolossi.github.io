# Kolossi

## Simple first table of contents

* [Adding analytics, ads, and a Paypal donate button to a site created using Github pages](github-pages-site-setup.html)
* [Raspberry Pi Storage Throughput Testing](pi-throughput-testing.html)


## Auto TOC

{% for article in site.articles %}
* [{{article.title}}]({{article.url}})
{% endfor %}