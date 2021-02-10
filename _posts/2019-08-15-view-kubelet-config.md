---
title: View kubelet config
categories: [kubernetes,quicktips]
---
The file used to configure the kubelet can be found at
`/var/lib/kubelet/config.yaml` on the node ...
<!--more-->

However this may not match the currently running config if the instructions
at [Generate the (Kubelet) configuration file](https://kubernetes.io/docs/tasks/administer-cluster/reconfigure-kubelet/) have been followed.

## View running configuration of the kubelet

- Set up $KUBECONFIG
- start a proxy to cluster port 8001
  - `kubectl proxy --port=8001 &`
- extract the config from the api, setting appropriate node name, e.g.:
  - `NODE_NAME="k8s-s-grn-g-m1"; curl -sSl "http://localhost:8001/api/v1/nodes/${NODE_NAME}/proxy/configz" | jq '.kubeletconfig|.kind="KubeletConfiguration"|.apiVersion="kubelet.config.k8s.io/v1beta1"'`
- kill the proxy
  - check the output of `jobs`, e.g.
    - '[1]+ Running    kubectl proxy --port=8001 &'
  - the job id is in the "[x]", and needs to be prefixed with '%', so above is:
    - `kill %1`
