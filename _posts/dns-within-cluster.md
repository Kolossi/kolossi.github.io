## Cluster dns service

### Provider

This is provided by

```bash
kubectl get service -n kube-system kube-dns
```
which as usual is resolved to the supporting coredns pods via

```bash
kubectl get endpoints -n kube-system kube-dns -o yaml
```

### clients

Lookups from within the pod and containers/workloads will first go to this dns
service, then external.  This is due to the usual pod setting
`dnsPolicy: clusterFirst` - see the [Kubernetes docs for dns pod service](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/#pod-s-dns-policy)

Note that cluster DNS is NOT used when directly on the host
(e.g k8s-p-grn-g-m1), since that is not "in" the cluster.

### name resolution

The cluster has a default subdomain which can be set, but which is usually
(including at tr) "svc.cluster.local".  The naming convention is
```
{service}.{namespace}.{cluster subdomain}
```

For example the cluster "fqdn" of the tr-pricing service in the api-prod
namespace is

```
tr-pricing.api-prod.svc.cluster.local
```

Within the cluster, the subdomain is not actually required, so the name used
to access another service in the cluster can be just `{service}.{namespace}`
 e.g. `tr-pricing.api-prod`.

Lastly, if the calling service is in the same namespace as the target, the
namespace can also be dropped so the name used by the parasol service in the
fe-prod namespace to access the graphql service in the fe-prod namespace, can
simply be `graphql`.

### deep dive

The namespace resolution can be seen by viewing `/etc/resolv.conf` within a
container, e.g. using a parasol container id:

```bash
sudo docker exec -it 64ee30adb34a  cat /etc/resolv.conf
nameserver 10.96.0.10
search fe-prod.svc.cluster.local svc.cluster.local cluster.local grn.uk.travelrepublic.com
options ndots:5
```

This shows the various search suffix allowing subdomain and namespace to be
ommitted, and also brings in the external default search path of the grn
domain.  The nameserver matches the cluster ip output of

```bash
kubectl get service -n kube-system kube-dns
```

The various lookups can also be tried in the same way by entering the container.
Using the parasol service container in the fe-prod namespace again:
- `sudo docker exec -it {container id} nslookup graphql` gives the expected answer
- `sudo docker exec -it {container id} nslookup tr-pricing` fails - because tr-pricing is not in the fe-prod namespace
- `sudo docker exec -it {container id} nslookup tr-pricing.api-prod` gives the expected service answer (with fqdn tr-pricing.api-prod.svc.cluster.local)
