setting up multiple panes
-------------------------

See
<https://stackoverflow.com/questions/5609192/how-to-set-up-tmux-so-that-it-starts-up-with-specified-windows-opened>

e.g. To set up a session to open multiple ssh's, or attach to existing
if already created, add the following to e.g. `~/bin/my-tmux` :

``` {.bash}
#! /bin/bash
ssh-add-if-needed /home/psweeney/.ssh/k8s-pp-psweeney
tmux attach -t 'k8spp' || \
tmux new-session -s 'k8spp' \; \
    send-keys 'ssh 10.171.141.120' C-m \; \
    split-window -v \; \
    send-keys 'ssh 10.171.141.121' C-m \; \
    split-window -v \; \
    send-keys 'ssh 10.171.141.122' C-m \; \
    split-window -v \; \
    send-keys 'ssh 10.171.141.123' C-m \; \
    select-layout tiled \; \
    select-pane -t 0 \;
```

for `ssh-add-if-needed` script, see [ssh setup](ssh_setup "wikilink")

handy keystrokes
----------------

`C-*` is Ctrl-\*

`M-*` is Alit-\*

-   `C-b z` - toggle window zoom full screen
-   `C-b :kill-session` (autocomplete available at “:” prompt) - exit
    session
-   `C-b d` - detach (/suspend/pause) session
    -   `tmux a -t 0` to resume
-   `C-b M-{1-5}` - Arrange panes in one of the five preset layouts:
    even-horizontal, even-vertical, main-horizontal, main-vertical, or
    tiled.
-   `C-b q {number}` - show pane identities, select one by number
-   `C-b :set synchronize-panes {on|off}` (autocomplete available at “:”
    prompt) - send the same text to all panes.
-   `C-b {pageup}` enter scrolling (aka “copy”) mode

handy command lines
-------------------

-   `tmux ls` show sessions

handy config
------------

Store in `~/.tmux.config`

### use bash prompt in each pane

-   `set-option -g default-command bash`

### increase pane history size

Otherwise default is &lt;2000 lines

-   `set-option -g history-limit 9999`

