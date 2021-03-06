---
title:    A Git auto push for Windows or Linux
tags: [quicktips,git,windows,linux]
---
To add a [post commit git webhook](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks) that can work on windows or \*nix, create a file in the local repo clone directory `./.git/hooks/post-commit` with the content...
<!--more-->

* On [windows](https://www.tygertec.com/git-hooks-practical-uses-windows/) (search for the correct `#!` path on the local system if this doesnt work):

```bash
#!C:/Program\ Files/Git/bin/sh.exe
git push origin main
```

* On \*nix:

```bash
#!/bin/sh
git push origin main
```

:information_source: The `./.git/hooks/post-commit` file is just on the local environment, so:
* it won't get pushed to upstream repo
* this will need to be redone for each environment/repo clone

## Automate commit message

To ease things further, [pre-fill the commit message]({{site.url}}/quicktips/git-pre-fill-commit-message.html)