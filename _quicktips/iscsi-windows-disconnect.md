---
title: Disconnecting an iscsi device in windows
date: 2021-01-17T19-25-03+00.00
---

# {{ page.title }}

To successfully disconnect an iscsi-mounted device in windows:

* In disk manager, in lower portion of screen, right-click on the disk itself (on the left hand side, not the partitions on the right), and select `Offline`
* in the iSCSI Initiator app:
  * in the `Favourite Targets` tab, select the item and choose `Remove`
  * in the `Targets` tab select the item and click `Disconnect`
* This may fail e.g. with the message:

> The session cannot be logged out since a device on that session is currently being used.

* if so, this may be due to windows Task Manager running which, if disk performance counters are enabled, holds the device open.
  * Close all open task manager instances
  * If disk performance counters are not required, to prevent this happening again, at an *administrator* powershell/command prompt, issue `diskperf -N`

#### Thanks

Useful info about task manager/performance counters was found [here](https://linustechtips.com/topic/1008639-force-iscsi-disconnect/?do=findComment&comment=12962632)