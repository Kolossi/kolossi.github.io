
# Bookmarks
{::options parse_block_html="true" /}

{% for thing in site.bookmarks %}
    {% assign logo-filename = thing.logo-name %}
    {% unless logo-filename %}
        {% assign logo-filename = thing.title | downcase | append: '.png'%}
    {% endunless %}
<div class='bookmark-loz'>
<a href="{{thing.target-url}}" target="_blank">![{{thing.title}}]({{site.url}}/assets/{{logo-filename}}) {{thing.title}}</a>
</div>
{% endfor %}

<div class="vspacer50px"></div>

<div id="random-quicktip" class="shadowtb"></div>

<script>
    var targetSelector="#random-quicktip";
    var items=[ 
        {% for item in site.quicktips %} 
            {
                "content": {{ item.excerpt | markdownify | jsonify }},
                "url": "{{ site.url }}{{ item.url }}"
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