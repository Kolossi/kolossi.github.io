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

- In a working directory, save a file `kubevela_dev_Dockerfile` with the 
following content:

 ```dockerfile
FROM golang:1.19.8-buster
WORKDIR /tmp
RUN curl -fsSL https://deb.nodesource.com/setup_19.x | bash
RUN apt-get update && apt-get install -y curl make git gcc bash nodejs
RUN git config --system --add safe.directory /root/kubevela
ENV PATH $PATH:/usr/local/go/bin
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
RUN install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
ENV KUBECONFIG /root/.kube/config
RUN cd /usr/local/go/ && curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s v1.49.0
RUN curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh"  | bash
RUN mv kustomize /usr/local/bin
RUN go install github.com/onsi/ginkgo/v2/ginkgo@latest
RUN curl -LO https://storage.googleapis.com/kubebuilder-tools/kubebuilder-tools-1.21.2-linux-amd64.tar.gz && \
      tar -zxvf  kubebuilder-tools-1.21.2-linux-amd64.tar.gz && \
      mkdir -p /usr/local/kubebuilder/bin && \
      mv kubebuilder/bin/* /usr/local/kubebuilder/bin
RUN go install cuelang.org/go/cmd/cue@latest
RUN go install honnef.co/go/tools/cmd/staticcheck@2022.1
RUN go install sigs.k8s.io/controller-tools/cmd/controller-gen@v0.6.2
RUN go install golang.org/x/tools/cmd/goimports@latest
RUN git clone https://github.com/bitnami-labs/readme-generator-for-helm
RUN npm install ./readme-generator-for-helm
RUN rm -rf /tmp/*
WORKDIR /root/kubevela
```

- Build the image with:

```
docker build -f kubevela_dev_Dockerfile -t kubevela_dev:1.0 .
```

- checkout kubevela code with

```
git clone git@github.com:kubevela/kubevela.git
```

- make your changes to the code

- use the docker image to perform the required `make` and `make reviewable` to 
validate the changes before pushing to a fork and raising a PR:

```
docker run -it --rm -v /home/YOUR-USER/repos/kubevela:/root/kubevela -v /home/YOUR-USER/.kube/:/root/.kube/ kubevela_dev:1.0 bash -c "make && make reviewable"
```

Note that edited files may have their owner and perms changed, to fix do:

```
chown YOUR-USER:YOUR-USER filename
chmod 644 filename
```

### Performance

To improve performance on re-runs, mount the go pkg directory from local into
the container so packages don't need to be downloaded each run:

```
cd ~/gopkg
docker run -it --rm -v /home/YOUR-USER/repos/kubevela:/root/kubevela -v /home/YOUR-USER/.kube/:/root/.kube/ -v /home/YOUR-USER/gopkg:/go/pkg kubevela_dev:1.0 bash -c "make && make reviewable"
```

### Thanks

The following links were helpful in preparing the docker file:

- [kubevela instructions](https://github.com/wonderflow/kubevela.io/blob/b4b7bae0a90e0b087df79e5ba5c46fdca072e4f6/docs/contributor/code-contribute.md#run-kubevela-locally)
- [kubectl install instructions](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)
- [nodejs install instructions](https://github.com/nodesource/distributions#debinstall)
