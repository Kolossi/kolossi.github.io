---
title: Wsl2 git slowdown fix
tags: [quicktips,wsl,git]
---
To workaround the slowdown using git on windows filesystem under wsl ...

<!--more-->

Define the following alias, which will choose to use `git.exe` when accessing
repos on windows drives (`/mnt/...` under wsl):

```bash
alias git='f(){ if [[ $PWD == /mnt/* ]] ;then git.exe "$@" ;else /usr/bin/git "$@" ;fi }; f'
```

> **Update 6-Aug-2021** : 
> new version above, previous version performed slow filesystem expansion:
>
> ```bash
> alias git='f(){ case $PWD/ in  /mnt/*) git.exe "$@";; *) /usr/bin/git "$@";; esac }; f'
> ```

### git settings

If using a repository with a lot of submodules, consider using the following
which will stop it descending into submodule working dirs.

```bash
git config --bool bash.showDirtyState false
```

If using [git-prompt.sh](https://github.com/git/git/blob/master/contrib/completion/git-prompt.sh)
 aka [__git_ps1](https://github.com/git/git/blob/master/contrib/completion/git-prompt.sh)
consider turning off some of the setttings using environment variables such as:
```bash
export GIT_PS1_SHOWDIRTYSTATE=1      # <--- my pref to leave this on
export GIT_PS1_SHOWUNTRACKEDFILES=
```

Note that each option turned off reduces the usefulness of the prompt.  

Some of the options are described in [this post](https://mjswensen.com/blog/git-status-prompt-options/).

#### Thanks

Given a steer by [this response](https://github.com/microsoft/WSL/issues/4401#issuecomment-670080585)
on the related WSL github issue.
