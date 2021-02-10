## Evicted pods ##

if a `kubectl get pods` output shows pods as evicted, this is because 
kubernetes has killed the pod to free resources.  It's likely something
has gone awry in terms of cluster workloads (user of control plane)
in terms of cpu and/or memory.

## View evicted pods ##

To directly view only evicted pods, use:

```
kubectl get pods --field-selector=status.phase=Failed
```

(add namespace specifier or `-A` as required)

For some reason using a status of "Evicted" does not work, "Failed" must be
used, which may include other pods not only evicted ones.

## Delete evicted pods ##

To delete the evicted pods, use:

```
kubectl delete pods --field-selector=status.phase=Failed
```
