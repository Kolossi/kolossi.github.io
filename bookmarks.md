---
title: Bookmarks
no_share_links: true
---

{::options parse_block_html="true" /}

{% for thing in site.bookmarks %}
    {% assign logo-filename = thing.logo-name %}
    {% unless logo-filename %}
        {% assign logo-filename = thing.title | downcase | append: '.png'%}
    {% endunless %}
<div class='bookmark-loz'>
<a href="{{thing.target-url}}" target="_blank">![{{thing.title}}]({{site.url}}/assets/img/{{logo-filename}}) {{thing.title}}</a>
</div>
{% endfor %}

<div class="vspacer50px"></div>

<div id="random-quicktip" class="shadowtb"></div>

<script>
    var targetSelector="#random-quicktip";
    var items=[ 
        {% for item in (site.posts | where: "categories","quicktips") %} 
            {
                "title": "{{ item.title }}",
                "content": {{ item.excerpt | markdownify | jsonify }},
                "url": "{{ site.url }}{{ item.url }}"
            },
        {% endfor %}
    ]
    var target = document.querySelector(targetSelector);
    if(target) {
        var chosenItem = items[ Math.floor(Math.random()*items.length) ];
        target.innerHTML = "<div class='post-tags'><a href='{{site.baseurl}}/tags/#quicktips'>quicktips</a></div><h2>" + chosenItem.title + "</h2>" + chosenItem.content + "<a href='" + chosenItem.url + "' class='read-more'>Read More</a>";
        target.onclick = function () { document.local.href= chosenItem.url }
    }
</script>