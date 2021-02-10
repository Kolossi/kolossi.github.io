## list containers in pod

See https://stackoverflow.com/questions/33924198/how-do-you-cleanly-list-all-the-containers-in-a-kubernetes-pod

``` bash
# all pods
kubectl get pods -A -o=custom-columns=NAME:.metadata.name,CONTAINERS:.spec.containers[*].name

# all pods in namesapce
kubectl get pods -n api-prod -o=custom-columns=NAME:.metadata.name,CONTAINERS:.spec.containers[*].name

# a specific pod
kubectl get pods -n api-prod tr-pricing-966d977b5-bgcf2 -o=custom-columns=NAME:.metadata.name,CONTAINERS:.spec.containers[*].name
```

This basically parses and outputs the same data seen in 
``` bash
kubectl describe pods tr-pricing-966d977b5-bgcf2 -n api-prod
```

### alternative with docker

```bash
sudo docker container ls | grep -i ${pod-name}
```

*Note* there will be an additional pod container based on the image
`k8s.gcr.io/pause`.  This is a "do nothing" image so there is always something
running in the pod and is used to hang the pod network on - see
https://stackoverflow.com/a/35179419
