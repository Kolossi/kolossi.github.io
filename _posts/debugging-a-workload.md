## Entering a running workload

### kubectl exec

From the pod name and namespace do:

```bash
kubectl exec -it ${pod} -n ${namespace} -- ${command and args}
```

e.g.

```bash
kubectl exec -it -n fe-prod parasol-778c67944c-8w6m7 -- cat /etc/resolv.conf
```

*Note* that this is running within the _pod_ and not the workload/containers it
is hosting

### docker exec

To find the container id follow [get-containers-in-pod.md](./get-containers-in-pod.md), then log on to the
node hosting the workload and do:

```bash
sudo docker exec -it ${container-id} {command to run}
```

Note that commands available are very limited - `cat` & `nslookup` are
available but `dig` & `ping` are not etc.

### nsenter the process

First find the PID of the worker process using one of the approaches below,
then do

```bash
sudo nsenter -t ${pid} -n ${command and args}
```

*NOTE* that this enters the linux namespace (the container/process "isolation"
mechanism) of the process but does not enter the filesystem of the container.
So e.g. `cat /etc/resolv.conf` will reveal the settings
of the host node, not the pod/container/workload.

e.g.

```bash
sudo nsenter -t 6446 -n ip addr       ### network address details
sudo nsenter -t 6446 -n netstat -tnp  ### active connections/ports
```

#### get process pid using docker

To find the container, follow [get-containers-in-pod.md](./get-containers-in-pod.md).

To then find the running pid from the container id (sha), do:

```bash
sudo docker inspect --format '{{ .State.Pid }}' ${container-id}
```

#### get the process pid using ps

Log on to the node hosting the workload and using `ps aux`, e.g.

```bash
ps aux | grep dotnet | grep -i useraccounts
ps aux | grep yarn
```
