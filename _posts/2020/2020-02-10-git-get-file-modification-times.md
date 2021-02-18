---
title: Git get file modification times
tags: [git]
---

To list the last git modification time of each source controlled file in the current directory ...
<!--more-->
Use:

```bash
git ls-tree -r --name-only HEAD | while read filename; do
  echo "$(git log -1 --format="%ad" -- $filename) $filename"
done
```

Less readable one-liner:
```bash
git ls-tree -r --name-only HEAD | while read filename; do echo "$(git log -1 --format="%ad" -- $filename) $filename"; done
```

#### Thanks

Info from this [serverfault response](https://serverfault.com/a/401450).