---
title: Fix git bad line length character
tags: [quicktips,git,ssh]
---
The error `Git Remote: Error: fatal: protocol error: bad line length character: {some 4 chars}` indicates that the git ssh command has got back an invalid response, namely some characters where it was expecting a 4-byte length value.

This is probably due to an error and the 4 chars in the error message will be the first 4 chars of the error response.

To investigate the error further to find the fix needed ...
<!--more-->

* Find the relevant remote url and repo path with `git remote -v`.  The value will likely be something like e.g. `git@ssh.dev.azure.com:v3/YouOrg/YourProject/YourRepo`.
* Before the `:` is the `host`, after it is the `repoPath`.
* issue the command `ssh {host} git-receive-pack {repoPath}` using the values from above
* this will reveal the true error message - likely something to do with auth or networking failure

#### Thanks

Solution found in this [StackOverflow response](https://stackoverflow.com/a/8175315)
