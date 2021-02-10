## Display Secret Values

To display the value of a kubernetes secret use e.g.

```
kubectl get secret -n api-staging travelrepublic-useraccounts-service -o jsonpath="{.data.connectionStringUserAccounts}" | base64 --decode
```

To show all data items in a single secret decoded use e.g.:

```
for s in `kubectl get secret tr-translator -o jsonpath="{.data.*}"`; do echo $s | base64 --decode;echo ; done
```

To show ALL data items in all secrets use e.g.:

```
for p in `kubectl get secret  -ojson | jq ".items[].metadata.name" | tr '\"' ' '`;do for s in `kubectl get secret $p -o jsonpath="{.data.*}"`; do echo $s | base64 --decode;echo ; done  ;done
```
