## kubectl port forwarding

Useful e.g. if needing to target blue when current active is green.

* Find a pod to target and its namespace e.g. `kubectl get pods -A | grep -i ...`
* Find the service port by either looking in the manifest or e.g. `kubectl get endpoints -A | grep -i ...`
* then map to a local port to this e.g. for port 7000 : `kubectl port-forward pods/alertmanager-main-0 7000:9093 -n monitoring`
* you can then hit localhost:7000

