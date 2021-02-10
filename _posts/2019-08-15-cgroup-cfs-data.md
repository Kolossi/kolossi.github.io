---
title: Linux cgroup cfs issues
#subtitle: more than the title
categories: [linux,kubernetes]
---
The CFS ("completely fair scheduler") in unix uses cgroups as part of
limiting memory and resources.

There are issues with the way the linux kernel deals with spiky
workloads, with a fix put in linux kernel 4.18 and later.
<!--more-->

## CFS issues

See https://github.com/kubernetes-monitoring/kubernetes-mixin/issues/108 &
https://github.com/kubernetes/kubernetes/issues/67577. We run Ubuntu 16.04
which originally came with Linux kernel 4.4. Later versions of Ubunutu 16.04.4
have up to at least kernel version 4.13 according to
https://en.wikipedia.org/wiki/Ubuntu_version_history.

As of writing, we still have the stock 4.4 kernel.

It seems from the discussion on the [2nd github issue](https://github.com/kubernetes/kubernetes/issues/67577#issuecomment-466609030) & contributions
there from chiluk, that a fix for a method of detecting "clock skew", which has
an effect on cpu throttling of spiky loads such as prometheues node-exporer,
is possibly included from kernel v4.18. However the earliest Ubuntu to have
 this is 18.10 (not LTS).

### Youtube talk by Henning Jacobs

See also Henning Jacobs talk on the subject - https://youtu.be/4QyecOoPsGU
mentioned on https://twitter.com/tpeitz_dus/status/1133648291332263936 in the
github discussion above.


### How to view CFS data

See https://youtu.be/4QyecOoPsGU?t=422 about requests:

```
kubectl run --requests=cpu=10m/5m ..sha512()..
# 10m means 10millicores, ie 0.01 core
# 
cat /sys/fs/cgroup/cpu/kubepods/burstable/pod5d5..0d/cpu.shares
10 # relative share of cpu time

cat /sys/fs/cgroup/cpu/kubepods/burstable/pod6e0..0d/cpu.shares
5 # relative share of cpu time

cat /sys/fs/cgroup/cpuacct/kubepods/burstable/pod5d5..0d/cpuacct.usage
    /sys/fs/cgroup/cpuacct/kubepods/burstable/pod6e0..0d/cpuacct.usage
13432815283 # total CPU time in nanoseconds
7528759332 # total CPU time in nanoseconds
```

So the cpu fraction split is reflected in the total cpu time.

Similarly, see https://youtu.be/4QyecOoPsGU?t=747 re limits, example:

```
docker run -- cpus 1 -m 200m -it busybox

cat /sys/fs/cgroup/cpu/docker/8ab25..1c/cpu.{shares,cfs_*}
1024    # cpu.shares (default value)
100000 # cpu.cfs_period_us (100ms period length)
100000 # cpu.cfs_quota_us (total CPU time in us consumable per period)

cat /sys/fs/cgroup/memory/docker/8ab25..1c/memory.limit_in_bytes
209715200  #200MB as requested
```

CFS quota period was hardcoded to 100ms in Kubernetes,
as of Kubernetes 1.12 now configurable - https://github.com/kubernetes/kubernetes/pull/63437

### View kubelet configuraion

See [view-kubelet-config](/view-kubelet-config)
