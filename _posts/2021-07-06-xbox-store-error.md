---
title: Microsoft Store for Gaming Services error 0x8007139f
tags: [quicktips,windows,xbox]
---
To reset the Microsoft Store for Gaming Services / Xbox app to get through
error 0x8007139f when trying to start or update a game...
<!--more-->

At an **Administator** powershell prompt:

```powershell
Get-AppxPackage *gamingservices* -allusers | remove-appxpackage -allusers
Remove-Item -Path "HKLM:\System\CurrentControlSet\Services\GamingServices" -recurse
Remove-Item -Path "HKLM:\System\CurrentControlSet\Services\GamingServicesNet" -recurse
```

Reboot, then to reinstall the store at an **Administator** powershell prompt:

```powershell
start ms-windows-store://pdp/?productid=9MWPM2CQNLHN
```

### Thanks

Info from this [xbox support response](https://support.xbox.com/en-ZA/help/errors/error-code-0x8007139f).
