---
title: Bash prompt setup
#subtitle: more than the title
#excerpt: This is what the page is really about
categories: [bash, linux, wsl ubuntu, git, kubernetes]
---
To get git information AND k8s cluster info AND history number in
bash prompt, added the following method to .bashrc...
<!--more-->

``` bash
# clear prompt cache files older than 1 day, and any for the current pid                                                                                                                                       \rm -f ~/.kcprmpt.$$
find ~ -maxdepth 1 -name '.kcprmpt*' -mtime +1 -type f -delete

get-k8s-cluster-name() {
        [[ -z $KUBECONFIG ]] && return

        # See https://stackoverflow.com/questions/592620/how-to-check-if-a-program-exists-from-a-bash-script
        [[ ! -x "$(command -v kubectl)" ]] && return

        cacheFile=~/.kcprmpt.$$
        if [ -f $cacheFile ]; then
            # https://stackoverflow.com/a/10527046
            IFS=: read kccfg kcprmpt < $cacheFile
            if [ "$KUBECONFIG" == "$kccfg" ]; then
                echo ' '$kcprmpt
                return
            fi
        fi

        # See https://github.com/bazelbuild/rules_k8s/pull/214
        current_context=$(kubectl config view -o=jsonpath='{.current-context}')
        cluster_name=$(kubectl config view --minify -o jsonpath='{.contexts[?(@.name == "'${current_context}'")].context.cluster}')
        echo $KUBECONFIG:$cluster_name > $cacheFile
        echo ' '$cluster_name
}
```

The find line at the beginning will clear cache files older than a day,
but to be super-clean, also add the following to `.bash_logout`

``` bash
rm -f ~/.kcprmpt.$$
```

The `$$` is bash shorthand for the pid of the current bash shell, and is
used in the cache filename because if there was only one cache file it
would screw up if two terminal were used with different KUBECONFIG,
which is a fairly comon use pattern. Then in the `if [ "$color_prompt" =
yes ]; then` section, added:

``` bash
    PROMPT_COMMAND='__git_ps1 "\${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;36m\]\w\[\033[01;33m\]\$(get-k8s-cluster-name)\[\033[00m\]" "\[\033[1;30m\][\!]\[\033[00m\]\$ "'
    export GIT_PS1_SHOWDIRTYSTATE=1
    export GIT_PS1_SHOWSTASHSTATE=1
    export GIT_PS1_SHOWUNTRACKEDFILES=  # <- this one is WAY too slow
    export GIT_PS1_SHOWUPSTREAM=auto    # <- 'verbose name' would be nice, but too slow
    export GIT_PS1_SHOWCOLORHINTS=1
    export GIT_PS1_HIDE_IF_PWD_IGNORED=1
```
For more details about the GIT options, see `/usr/lib/git-core/git-sh-prompt` (which is where \_\_git\_ps1 is defined).

### Explanation of PROMPT COMMAND

The `__git_ps1` command can take two param - prompt spec to go before the GIT prompt and a prompt spec to go after.

* `\${debian_chroot:+($debian_chroot)}` - if you are chroot'd it will show the chroot
* `\[\033[01;32m\]` - set bright green
* `\u@\h\` - show "{user}@{host}"
* `\[\033[00m\]` - reset to white
* `:` - literal char
* `\[\033[01;36m\]` - bright cyan
* `\w` - working directory
* `\[\033[01;33m\]` - bright yellow
* `\$(get-k8s-cluster-name)` use the function to get the k8s cluster name
* `\[\033[00m\]` - reset to white, the git prompt expects this

Then the git details go in here if in a git dir, and according to the options set

* `\[\033[1;30m\]` - medium grey
* `[` - literal char
* `\!` - show history number, so you can do e.g. !157 to rerun a given command
* `]` - literal char
* `\[\033[00m\]` - reset to white
* `\$` - a literal $
* ` ` - a literal space before the user gets the prompt

