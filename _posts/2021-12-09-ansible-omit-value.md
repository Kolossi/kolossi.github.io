---
title: Ansible omit value
tags: [quicktips,ansible]
---
The ansible special variable `omit` can be used to skip a task parameter ...
<!--more-->

It can also be though of as "noop" or "skip" directive.

If it's ultimately given as the value of a parameter, ansible behaves as if
that parameter was not given. 

Often used with {% raw %}`{{ myvar|default() }}`{% endraw %}.

Example usage from [ansible docs](https://docs.ansible.com/ansible/latest/reference_appendices/special_variables.html)
(search for "omit") :


{% raw %}
```
- user:
    name: bob
    home: "{{ bobs_home|default(omit) }}"
```
{% endraw %}
