---
title: Escape backtick in markdown code block
tags: [quicktips,markdown]
---
To use a backtick (`` ` ``) within a markdown inline code block...

<!--more-->
Use double-backticks as code block delimitter rather than single to wrap the code, e.g.

``` ``List`1`` ``` in markdown will render as ``List`1``

The number of backticks can be increased as required, e.g. the markdown for the example above is actually

```` ``` ``List`1`` ``` ````

Which needed to be shown by wrapping the whole lot in 4-backticks etc... :slightly_smiling_face:

If there is a leading or trailing backtick, the code will need to be separated from the delimiters by a space, e.g. for `` ctrl-` `` use ``` `` ctrl-` `` ```.

As long and both entering and trailing spaces are used to the delimeter, they will not be rendered.


#### Thanks

Info from this [stackoverflow response](https://meta.stackexchange.com/a/82722/374981).