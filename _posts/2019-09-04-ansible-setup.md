---
title: Ansible setup
#subtitle: more than the title
excerpt_separator: <!--more-->
#excerpt: This is what the page is really about
categories: [ansible,windows,wsl ubuntu]
---

To install on WSL Ubuntu, follow:

- https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html?extIdCarryOver=true&sc_cid=701f2000001OH7YAAW#latest-releases-via-apt-ubuntu ...
<!--more-->

```
$ sudo apt update
$ sudo apt install software-properties-common
$ sudo apt-add-repository --yes --update ppa:ansible/ansible
$ sudo apt install ansible
```
