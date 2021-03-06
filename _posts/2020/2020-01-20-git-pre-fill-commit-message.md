---
title: Pre-fill git commit message
tags: [quicktips,git]
---
To have the git commit message pre-populated with a standard value...
<!--more-->
* Create a file in the repo `.git` directory named e.g. `.git/.gitmessage.txt` containing the required message, e.g. a template for the dev to follow such as that given in [the git docs](https://www.git-scm.com/book/en/v2/Customizing-Git-Git-Configuration#_commit_template) or just a generic:
```
update
```

* add the following content to `.git/config`
```config
[commit]
	template = .git/.gitmessage.txt
```

:information_source: The `.git/config` and `.git/.gitmessage.txt` files are just on the local environment, so:
* they won't get pushed to upstream repo
* this will need to be redone for each environment/repo clone