---
title: Kubevela PR build
#subtitle: more than the title
#excerpt: This is what the page is really about
tags: [quicktips,kubevela,pr,build]
---
To perform a build of kubevela to submit a pr, but without installing
all the dependencies on local ...
<!--more-->

Here's how to do it on Windows WSL2 with Docker Desktop.

- Start Docker Desktop and do

  -  :gear: -> kubernetes -> :ballot_box_with_check: Enable Kubernetes -> apply

- Start WSL2 prompt.

**NOTE** : the required docker image is available on docker hub as
[kolossi/kubevela_dev:1.0.19](https://hub.docker.com/r/kolossi/kubevela_dev/tags), 
so there isn't a need to build it, but if you wish to do so:

> - In a working directory, save a file `kubevela_dev_Dockerfile` with the following content:
> 
>  ```dockerfile
> FROM golang:1.19.10-buster
> WORKDIR /tmp
> RUN apt-get update && apt-get install -y curl make git gcc bash ca-certificates gnupg
> RUN mkdir -p /etc/apt/keyrings
> RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
> ENV NODE_MAJOR=21
> RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
> RUN git config --system --add safe.directory /root/kubevela
> RUN apt-get update && apt-get install -y nodejs
> ENV PATH $PATH:/usr/local/go/bin:/root/kubevela/bin
> RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
> RUN install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
> ENV KUBECONFIG /root/.kube/config
> RUN cd /usr/local/go/ && curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b /usr/local/go/bin v1.49.0
> RUN curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh"  | bash
> RUN mv kustomize /usr/local/bin
> RUN go install github.com/onsi/ginkgo/v2/ginkgo@latest
> RUN curl -LO https://storage.googleapis.com/kubebuilder-tools/kubebuilder-tools-1.21.2-linux-amd64.tar.gz && \
>       tar -zxvf  kubebuilder-tools-1.21.2-linux-amd64.tar.gz && \
>       mkdir -p /usr/local/kubebuilder/bin && \
>       mv kubebuilder/bin/* /usr/local/kubebuilder/bin
> RUN go install cuelang.org/go/cmd/cue@v0.4.3
> RUN go install honnef.co/go/tools/cmd/staticcheck@2022.1
> RUN go install sigs.k8s.io/controller-tools/cmd/controller-gen@v0.6.2
> RUN go install golang.org/x/tools/cmd/goimports@latest
> RUN git clone https://github.com/bitnami-labs/readme-generator-for-helm
> RUN npm install ./readme-generator-for-helm
> RUN rm -rf /tmp/*
> WORKDIR /root/kubevela
> ```
>
> - Build the image with:
>
> ```
> docker build -f kubevela_dev_Dockerfile -t kolossi/kubevela_dev:1.0.19 .
> ```


- checkout kubevela code with

```shell
git clone git@github.com:kubevela/kubevela.git
```

- make your changes to the code

- use the docker image to perform the required `make` and `make reviewable` to 
validate the changes before pushing to a fork and raising a PR:

```shell
docker run \
        -it --rm \
        -v /home/YOUR-USER/repos/kubevela:/root/kubevela \
        -v /home/YOUR-USER/.kube/:/root/.kube/ \
        kolossi/kubevela_dev:1.0.19 \
        bash -c "make && make reviewable"
```

Note that edited files may have their owner and perms changed, to fix do:

```
chown YOUR-USER:YOUR-USER filename
chmod 644 filename
```

### Performance

To improve performance on re-runs, mount the go pkg directory from local into
the container so packages don't need to be downloaded each run:

```shell
docker run \
        -it --rm \
        -v /home/YOUR-USER/repos/kubevela:/root/kubevela \
        -v /home/YOUR-USER/.kube/:/root/.kube/ \
        -v /home/YOUR-USER/gopkg:/go/pkg \
        kolossi/kubevela_dev:1.0.19 \
        bash -c "make && make reviewable"
```

### zscaler

If using ZScaler (or another MITM proxy), errors will occur during the kubevela
build due to the https/TLS connection not validating the untrusted CA cert.

To fix this, get a copy of the ca cert and store it in a `certs` subdirectory
of your home dir.  The builder image can then be used with the modified command:

```shell
docker run \
        -it --rm \
        -v /home/YOUR-USER/repos/kubevela:/root/kubevela \
        -v /home/YOUR-USER/.kube/:/root/.kube/ \
        -v /home/YOUR-USER/gopkg:/go/pkg \
        -v /home/YOUR-USER/certs/ZscalerRootCertificate-2048-SHA256.crt:/usr/local/share/ca-certificates/ZscalerRootCertificate-2048-SHA256.crt \
        kolossi/kubevela_dev:1.0.19 \
        bash -c "update-ca-certificates && npm config set cafile /etc/ssl/certs/ca-certificates.crt && make && make reviewable"
```

### Thanks

The following links were helpful in preparing the docker file:

- [kubevela instructions](https://github.com/wonderflow/kubevela.io/blob/b4b7bae0a90e0b087df79e5ba5c46fdca072e4f6/docs/contributor/code-contribute.md#run-kubevela-locally)
- [kubectl install instructions](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)
- [nodejs install instructions](https://github.com/nodesource/distributions#debinstall)
- [debian/alpine zscaler ca fix](https://stackoverflow.com/a/67232164/2738122)
- [npm zscaler ca fix](https://stackoverflow.com/a/67688638/2738122)
