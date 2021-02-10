## Show all images used by deployments in cluster

``` bash
kubectl get deployments -A -o json| jq '.items[] |{name:.metadata.name, image:.spec.template.spec.containers[].image}'
```
