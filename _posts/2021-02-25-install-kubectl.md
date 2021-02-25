---
title: Installing kubectl
tags: [kubernetes,wsl,linux]
---

To install the kubectl command in linux including WSL ...
<!--more-->

First choose the correct version number with reference to the target
cluster(s).

In the examples below, "v1.20.0" is used - change as necessary.

To download the binary, do

```bash
# change "amd64" to "arm64" if required
# change version number if required
curl -LO https://dl.k8s.io/release/v1.20.0/bin/linux/amd64/kubectl
```

## Verify sha

To download the SHA to confirm valid download, issue the following to download
the checksum:

```bash
# change "amd64" to "arm64" if required
# change version number if required
curl -LO https://dl.k8s.io/release/v1.20.0/bin/linux/amd64/kubectl
```

>:information_source: This is not ideal sha comparison as any redirect of the download using dns spoofing can also supply a fake sha

To do the compare:

```bash
echo "$(<kubectl.sha256) kubectl" | sha256sum --check
```

## Install

To install kubectl, do

```bash
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

## Test

Confirm install with `kubectl version --client`