## To delete a k8s namespace

strictly, all that is necessary is
```bash
kubectl delete namespace monitoring
```

This will delete all resources linked to the namespace.

However, as noted by [Khanh Ngo - Deleting Kubernetes namespace issue](https://blog.ndk.name/deleting-kubernetes-namespace-issue/),
the namespace can end up stuck `Terminating`.

----

**NOTE:** DO NOT make this fix before deleting the namespace - if this is done, just the namespaces will be deleted and none of the resources will be deleted with it.
They will be left as resources with e.g. namespace "monitoring" even if namespace "monitoring" no longer exists.

----

The issue is the populated `finalisers:` value in the namespace spec.

To fix this for the monitoring namespace, as per [IBM - A namespace is stuck in the Terminating state](https://www.ibm.com/support/knowledgecenter/en/SSBS6K_3.1.1/troubleshoot/ns_terminating.html), do
```bash
kubectl get namespace monitoring -ojson > tmp.json
```

Edit `tmp.json` so that
```json
      "spec": {
         "finalizers": 
           "kubernetes"
      },
```

is corrected to

```json
      "spec": {
         "finalizers": []
      },
```

Then run proxy so  the api can be use:

```bash
kubectl proxy &
```

Now use the api to apply the corrected namespace spec:
```bash
curl -k -H "Content-Type: application/json" -X PUT --data-binary @tmp.json http://127.0.0.1:8001/api/v1/namespaces/<terminating-namespace>/finalize
```

The namespace should now disappear.
