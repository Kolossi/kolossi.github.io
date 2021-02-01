---
title: VSCode preserve installed extensions
modified: 2021-01-25T11-59-25+00.00
excerpt_separator: <!--more-->
---

# {{ page.title }}

To export and recreate installed VSCode extentions...
<!--more-->

Export the list of installed extensions from an existing VSCode with:
* ``ctrl-` `` then one of:
  * Powershell: `code --list-extensions | % { "code --install-extension $_" } > vscode_extensions.ps1`
  * Bash: `code --list-extensions | xargs -L 1 echo code --install-extension > vscode_extensions.sh`

To recreate, run the script.

#### Thanks

Info from this [stackoverflow response](https://stackoverflow.com/a/49398449/2738122).
