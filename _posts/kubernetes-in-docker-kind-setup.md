## Kubernetes in Docker (KIND) setup

  - Install go lang with `sudo apt update && sudo apt install
    golang-go`. Found it was an old version (1.10)
      - upgrade everything : `sudo apt-get update && sudo apt-get -y
        upgrade`
      - check latest version at <https://golang.org/dl/>
      - following <https://tecadmin.net/install-go-on-ubuntu/>
          - ` wget
             `<https://dl.google.com/go/go1.12.6.linux-amd64.tar.gz>
          - `sudo tar -xvf go1.12.6.linux-amd64.tar.gz`
          - did `which go` and found it was in `/usr/bin`
          - in fact it is softlinked:
              - `/usr/lib/go -> go-1.10`
              - `/usr/bin/go -> ../lib/go-1.10/bin/go`
              - `/usr/bin/gofmt -> ../lib/go-1.10/bin/gofmt`
          - so I changed the article (and the setup style) and did:
              - `sudo mv go /usr/lib/go-1.12.6`
              - `sudo rm /usr/lib/go && sudo ln -s /usr/lib/go-1.12.6/
                /usr/lib/go`
              - `sudo rm /usr/bin/go && sudo ln -s /usr/lib/go/bin/go
                /usr/bin/go`
              - `sudo rm /usr/bin/gofmt && sudo ln -s
                /usr/lib/go/bin/gofmt /usr/bin/gofmt`
  - Install kind, following <https://github.com/kubernetes-sigs/kind>
    (with older version of go \<1.12.6 this didn't work)
      - `GO111MODULE="on" go get sigs.k8s.io/kind@v0.4.0`
      - seemed to have to run this twice as there was an error first
        time about yaml.v2, but running the command again it completed
      - add `export PATH="$PATH:$HOME/go/bin"` to end of `~/.profile`
        and `. ~/.profile`
      - can now do `kind create cluster` (and `kind delete cluster`)
      - as suggested by `kind create cluster`, added `alias kck='export
        KUBECONFIG="$(kind get kubeconfig-path --name="kind")"'` to
        `~/.bash_aliases`
      - can now do
          - `kubectl cluster-info`
          - `kubectl version`
          - `kubectl get pods -A`
          - etc
  - kind command docs : <https://kind.sigs.k8s.io/docs/user/quick-start>
      - e.g. for multi-node cluster (master and workers) - see
        <https://kind.sigs.k8s.io/docs/user/quick-start#configuring-your-kind-cluster>
