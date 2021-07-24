---
title: Hosts file edit shortcut with gvim
tags: [quicktips,windows,vim,gvim]
---

To enable `hosts` file edit using a gvim shortcut, without breaking explorer
`Edit with vim` right-click action ...

<!--more-->

* create a shortcut with command:
```
"C:\Program Files (x86)\Vim\vim82\gvim.exe" "C:\windows\system32\drivers\etc\hosts"
```
* on the shortcut property page, under the `Shortcut` tab, choose "Advanced" and check "Run as administrator"

> :warning: DO NOT go to shortcut `Compatability` tab and select "Run this program as an administrator" - this will make gvim ALWAYS run as admin and right-click "Edit with Vim..." option will be broken, reporting `gvimext.dll error creating process: check if gvim is in your path!`