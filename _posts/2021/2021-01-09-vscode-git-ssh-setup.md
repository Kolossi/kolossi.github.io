---
title:    VSCode Git SSH setup
tags: [quicktips,vscode,git,ssh]
---
To enable vscode git extension to use pageant-served ssh certificates...
<!--more-->
* download and install [PuTTY](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html)
* find the installed path of `plink.exe` - usually `C:\Program Files\PuTTY\plink.exe`
* set `GIT_SSH` and `GIT_SSH_COMMAND` environment variables to this path:

```bash
GIT_SSH="C:\Program Files\PuTTY\plink.exe"
GIT_SSH_COMMAND="C:\Program Files\PuTTY\plink.exe"
```

----
> :information_source: Most programs use `GIT_SSH` and VSCode picks this up but gives an error that it can't spawn `plink.exe` due to permission denied.
>
> To get VSCode working, also set `GIT_SSH_COMMAND`

> :exclamation: If the error `plink: unknown option "-o"` occurs, see [Fix git plink unknown option error]({{site.url}}\quicktips\git-plink-unknown-option-o.html).