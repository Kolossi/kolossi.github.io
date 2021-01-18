
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

![up shadow](/assets/blue-shadow-up.png)

<div id="random-quicktip"></div>

![down shadow](/assets/blue-shadow-down.png)

<script>
    var targetSelector="#random-quicktip";
    var items=[ 
        {% for item in site.quicktips %} 
            {
                "content": {{ item.excerpt | markdownify | jsonify }},
                "url": "{{site.url}}{{ item.url }}"
            },
        {% endfor %}
    ]
    var target = document.querySelector(targetSelector);
    if(target) {
        var chosenItem = items[ Math.floor(Math.random()*items.length) ];
        target.innerHTML = chosenItem.content;
        target.onclick = function () { document.local.href= chosenItem.url }
    }
</script>