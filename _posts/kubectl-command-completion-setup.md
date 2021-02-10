## kubectl command completion

added the following to `.bashrc`:

``` bash
source <(kubectl completion bash)
```

if you alias `kubectl` with e.g.

``` bash
alias k=kubectl
```

then be sure to also add

``` bash
complete -F __start_kubectl k  # <-- so the alias also gets command completion
```
