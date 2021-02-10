## some (possibly) helpful git aliases 

Add the following to `git config --global --edit`

```
[alias]
    llog = "!echo \\>\\>\\>=====\\> git log -20 --graph --pretty='%C(yellow)%h%C(auto)%d %Creset%s %Cgreen(%an, %cr)' $@;echo; git log -20 --graph --pretty='%C(yellow)%h%C(auto)%d %Creset%s %Cgreen(%an, %cr)' $@"
    plog = "!echo \\>\\>\\>=====\\> git log -20 --pretty='%C(yellow)%h%C(auto)%d %Creset%s %Cgreen(%an, %cr)' $@;echo; git log -20 --pretty='%C(yellow)%h%C(auto)%d %Creset%s %Cgreen(%an, %cr)' $@"
    ffmerge = "!echo \\>\\>\\>=====\\> git merge --ff-only $@; git merge --ff-only $@"
    sta = "!echo \\>\\>\\>=====\\> git status $@; git status $@"
    fav = "!echo \\>\\>\\>=====\\> git fetch --all -v $@; git fetch --all -v $@"
    whereis = "! echo \\>\\>\\>=====\\> TL\\;DR - see git alias;echo 'Branches:';git branch --all --contains \"$1\";echo 'Tags:';for tag in `git tag`; do git merge-base --is-ancestor $tag \"$1\"; if [ $? -ne 0 ]; then echo '  '$tag; fi;done #"
    pblame = "!echo \\>\\>\\>=====\\> git blame -cMCCC --date=format:'%Y-%b-%d %H:%M' $@; git blame -cMCCC --date=format:'%Y-%b-%d %H:%M' $@"
    alias = "!echo \\>\\>\\>=====\\> git config --get-regexp alias $@; git config --get-regexp alias $@"
```
