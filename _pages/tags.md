---
layout: page
permalink: /tags/
title: Tags
---


<div id="archives">
{% for tag in site.tags %}
  <div class="archive-group">
    {% capture tag_name %}{{ tag | first }}{% endcapture %}
    <a name="{{ tag_name | slugize }}"></a>
    <h3 class="tag-head">{{ tag_name }}</h3>
    <ul>
    {% for post in site.tags[tag_name] %}
      <li><a href="{{ site.baseurl }}{{ post.url }}">{% if post.title and post.title != "" %}{{post.title}}{% else %}{{post.excerpt |strip_html}}{%endif%}</a></li>
    {% endfor %}
    </ul>
  </div>
{% endfor %}
</div>