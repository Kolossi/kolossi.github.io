---
title: Tmux connection hang
tags: [quicktips,wsl,tmux,ssh,linux]
---
To prevent [Tmux](https://tmux.github.io/) windows which spawn ssh 
connections from hanging due to connection drop...
<!--more-->

Add the following properties to `~/.ssh/config`:

```
    KeepAlive yes
    ServerAliveInterval 60
```
This will prevent the ssh connection dropping out.

> :information_source: This probably shouldn't be used for production hosts, being bad network etiquette.

### Thanks

Info from this [stackoverflow response](https://serverfault.com/a/663626/547541).
