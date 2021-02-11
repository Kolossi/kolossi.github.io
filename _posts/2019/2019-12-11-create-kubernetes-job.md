---
title: Create kubernetes job from cronjob
tags: [kubernetes]
---
To create a onetime kubernetes job from an existing cronjob...
<!--more-->

* `kubectl create job --from=cronjob/{exisiting-kubernetes-cron-job} {manual-job-name}`

