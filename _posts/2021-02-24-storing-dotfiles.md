---
title: Storing dotfiles
tags: [quicktips,wsl,bash,linux]
---
Here's my take on how to store "dotfiles"...
<!--more-->
Here's how to store all your "dotfiles" in git with least pain.

"dotfiles" are those files in a linux home dir that store setup, files like
`.bashrc`, `.gitconfig`, `.vimrc`.

This post is based largely on an [Atlassian post](https://www.atlassian.com/git/tutorials/dotfiles),
though cut down to the absolute basics.

## Create local repo

First setup an empty repo, and a `config` alias for git, just for this repo
(all existing git aliases will still work with `config`).

```bash
git init --bare $HOME/.cfg
alias config='/usr/bin/git --git-dir=$HOME/.cfg/ --work-tree=$HOME'
config config --local status.showUntrackedFiles no
echo "alias config='/usr/bin/git --git-dir=$HOME/.cfg/ --work-tree=$HOME'" >> $HOME/.bash_aliases
```

Add all the files to be version controlled:

```bash
cd $HOME
config add .profile
config add .bashrc
config add .bash_aliases
config add .vimrc
```

Some like `.ssh` and `.kube` dirs might need a little more work (and ONLY
do these if the remote repo will not be publically accessible):

```bash
echo -e 'agents/\nagent.env' > .ssh/.gitignore
config add .ssh
echo -e 'cache/\nhttp-cache/' > .kube/.gitignore
config add .kube
```

This is just so doing e.g. `config add .ssh` won't add the unwanted files.
Any untracked files are ignored due to the config that was set on the repo.

To prevent it being possible to recursively add the local repo:

```bash
echo '.cfg/' >> .gitignore
config add .gitignore
```

Any command or alias that can be issue with `git` can now be issued with
`config`, and can be issued from anywhere in the directory tree, but will always 
refer to the home dir e.g.

```bash
/home/me/myrepos/mywork$ config status
On branch master

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)

        new file:   .ansible.cfg
        new file:   .bash_aliases
        new file:   .bash_logout
...
```

## Create remote repo

Commit any pending changes with e.g. 
```bash
config commit -m 'first commit'
```

Create a completely empty repo on a remote repository - suggested repo
naming `cfg_{machine-name}` or just `cfg`.

Add this as a remote to the config repo and push changes:

```bash
config remote add origin ssh://git@bitbucket.myhost.com/~me/cfg_my-machine.git
config push --set-upstream origin master
```

If the repo is accessed via ssh, be sure to store the key file elsewhere so that
the data can be cloned from the repo on any new install.

## Using on a new install

### alias

First setup a temporary version of the config alias

```bash
alias config='/usr/bin/git --git-dir=$HOME/.cfg/ --work-tree=$HOME'
```

### ssh creds

If the repo requires ssh authentication, retrieve the key file onto the new
system, and make sure permissions are locked down.  Then start the ssh agent
and add the key:

```bash
cp {somewhere}/my-key ~/.ssh
chmod 600 ~/.ssh/my-key
eval $(ssh-agent -s)
ssh-add ~/.ssh/my-key
```

### get files

Clone the repo and checkout
```bash
git clone --bare <git-repo-url> $HOME/.cfg
config checkout
```

Any existing files of the same name will cause errors so backup or remove
and repeat the checkout command.

Set the clone to ignore untracked files:

```bash
config config --local status.showUntrackedFiles no
```

Logout and back in to pickup new `.bashrc`, `.profile`, aliases etc.

That should be it!




