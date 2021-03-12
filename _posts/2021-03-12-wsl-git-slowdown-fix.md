---
title: Wsl2 git slowdown fix
tags: [wsl,git]
---
To workaround the slowdown using git on windows filesystem under wsl ...
<!--more-->
Define the following alias, which will choose to use `git.exe` when accessing
repos on windows drives (`/mnt/...` under wsl):

```bash
alias git='f(){ case $PWD/ in  /mnt/*) git.exe "$@";; *) /usr/bin/git "$@";; esac }; f'
```

#### Thanks

Given a steer by [this response](https://github.com/microsoft/WSL/issues/4401#issuecomment-670080585) on a WSL github issue.