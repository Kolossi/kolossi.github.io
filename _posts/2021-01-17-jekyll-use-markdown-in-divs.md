---
title: Using Jekyll markdown in divs
tags: [quicktips,jekyll]
---
To allow Jekyll (Liquid) to parse markup in page blocks like divs, add the folowing at the top of the page...
<!--more-->
```markdown
{% raw %}{::options parse_block_html="true" /}{% endraw %}
```

#### Thanks

Info found on [this r/Jekyll response](https://www.reddit.com/r/Jekyll/comments/31rg4g/using_markdown_in_divs/cq4asit)
