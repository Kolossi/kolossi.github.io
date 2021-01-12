---
title:    VSCode Git SSH setup
modified: 2021-01-09T21-50-00+00.00
---
# vscode git ssh setup

To enable vscode git extension to use pageant-served ssh certificates
* download and install [PuTTY](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html)
* find the installed path of `plink.exe` - usually `C:\Program Files\PuTTY\plink.exe`
* set `GIT_SSH` and `GIT_SSH_COMMAND` environment variables to this path:
```bash
GIT_SSH=C:\Program Files\PuTTY\plink.exe
GIT_SSH_COMMAND=C:\Program Files\PuTTY\plink.exe
```

Most programs use `GIT_SSH` and VSCode picks this up but gives an error taht it can't spwan `plink.exe` due to permission denied.

To get it working, also set `GIT_SSH_COMMAND`