---
title: Fix git plink unknown option error
modified:  2021-01-20T09-53-42+00.00
excerpt_separator: <!--more-->
---

# {{ page.title }}

The error `plink: unknown option "-o"` indicates that the git ssh command has been set to `plink.exe`, but git believes it is interacting with an OpenSSH command.

To fix the error, choose one of the following to set the ssh variant ...
<!--more-->

* Set the following config in the appropriate (`--global`, `--system` or `--local`) git config e.g. by issuing `git config --global --edit` :
```config
[ssh]
    variant = plink
```

* Do it all in one with:
```bash
git config --global ssh.variant plink
```

* If the `ssh.variant` is already explicitly set to `ssh`, then just removing this hard setting and allowing git to auto-detect may well be enough - e.g. `git config --global --unset ssh.variant`
* Environment variables override git config, so if the ssh command has been set to plink via environment variable, set the following environment variable (use the same user/system scope as current `GIT_SSH` and `GIT_SSH_COMMAND` setting)
```bash
GIT_SSH_VARIANT=plink
```

#### Thanks

Solution found due this [StackOverflow response](https://stackoverflow.com/a/45576707)
