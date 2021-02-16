---
title: Git and ssh known_hosts population
categories: [git,ssh]
---

Here's a trick to get a host key automatically registered by ssh, particularly
when used by git as part of a build pipeline...
<!--more-->

The main trick is to use the ssh `-o StrictHostKeyChecking=no` option:

```bash
ssh -o StrictHostKeyChecking=no user@server
```

If the relevant `known_hosts` file does not contain the server or even does not
exist, it will create the file and add the server key. 

This is particularly useful when using ssh as part of git command via the 
`GIT_SSH_COMMAND` env var:

```bash
GIT_SSH_COMMAND=ssh -o StrictHostKeyChecking=no -i keyfile user@server
```

When this is run as part of a pipeline on a build server, and therefore is
running under a service user, it can be particularly difficult to locate the
`known_hosts` file.

For instance if running under LocalSystem, the file could be something like 
`C:\Windows\SysWOW64\config\systemprofile\.ssh\known_hosts`.

Errors relating to this may show something like `Host key verification failed`
but also maybe something as obscure as `read_passphrase: can't open /dev/tty: No such device or address`
(even though the key file has no passphrase!).

Once the `known_hosts` file has been update, the `-o StrictHostKeyChecking=no`
will no longer be needed and can be removed again.

#### Thanks

Info found on this [StackExchange response](https://unix.stackexchange.com/a/416186) 