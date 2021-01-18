---
title: Using Jekyll markdown in divs
date: 2021-01-17T14-35-04+00.00
excerpt_separator: <!--more-->
---
# {{ page.title }}

To allow Jekyll (Liquid) to parse markup in page blocks like divs, add the folowing at the top of the page...
<!--more-->
```markdown
{::options parse_block_html="true" /}
```

#### Thanks

Info found on [this r/Jekyll response](https://www.reddit.com/r/Jekyll/comments/31rg4g/using_markdown_in_divs/cq4asit)
