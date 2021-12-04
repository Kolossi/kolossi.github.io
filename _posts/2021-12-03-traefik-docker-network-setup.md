---
title: Traefik docker network setup
tags: [quicktips,traefik,docker]
---
There's a gotcha when setting up Traefik in docker to proxy for other docker containers ...
<!--more-->

Setting a test with traefik and a service in the same docker-compose file works fine because they can access each other. e.g.:

```
 version: "3"
 services:
   traefik:
     image: "traefik:v2.5.4"
     command:
       - --entrypoints.web.address=:80
       - --providers.docker=true
       - --providers.docker.defaultRule=Host(`app.mydomain.com`) && PathPrefix(`/{{ index .Labels "com.docker.compose.service" }}`)
     ports:
       - "80:80"
     volumes:
       - "/var/run/docker.sock:/var/run/docker.sock:ro"
 
   app1:
     image: containous/whoami:v1.3.0
```

However once in separate files, by default they can't access each other.  Docker has (some) segregation between different workloads, this is generally a good thing.

To deal with this, a shared docker "network" must be specified in both docker compose files, e.g.:

### traefik\docker-compose.yml
```
 version: "3"
 services:
   traefik:
     image: "traefik:v2.5.4"
     command:
       - --entrypoints.web.address=:80
       - --providers.docker=true
       - --providers.docker.defaultRule=Host(`app.mydomain.com`) && PathPrefix(`/{{ index .Labels "com.docker.compose.service" }}`)
     ports:
       - "80:80"
     volumes:
       - "/var/run/docker.sock:/var/run/docker.sock:ro"
    networks:
      - proxy
networks:
  proxy:
    name: proxy
```

### app1\docker-compose.yml

```
 version: "3"
 services:
   app1:
     image: containous/whoami:v1.3.0
    networks:
      - proxy
networks:
  proxy:
    name: proxy
```

This will create a docker network "proxy" when the first container is started with `docker-compose up`, and when the second container is started, it will attach to the same network.  Traefik will be able to forward traffic to app1 - all good!:

```
~/traefik# docker-compose up -d
Creating network "proxy" with the default driver
Creating traefik ... done
~/traefik# cd ../app1
~/app1# docker-compose up -d
Creating app1 ... done
```

However when doing a `docker-compose down` of a single container, either the network will get deleted, breaking things, for all workloads or more likely the command will raise an error saying that the network is in use:

```
~/app1# docker-compose down
Stopping app1 ... done
Removing app1 ... done
Removing network proxy
ERROR: error while removing network: network proxy id 89fdb7c83df9bfc78461d541c79a937dc302236a6257213621f009ae558c2993 has active endpoints
```

To get around this the network needs to be flagged as "external".  This does mean that it will not be auto-created and this has to be done as a seperate step.  Thankfully, the error message that results tells exactly what to do:

```
~/traefik# docker-compose up -d
ERROR: Network proxy declared as external, but could not be found. Please create the network manually using `docker network create proxy` and try again.
```

## Solution

So the solution is to issue the following command, just one time ever, on a hosting system:

```
~\traefik# # docker network create proxy
514fd1c7ef8334fd68afce175656caa05f0785c0dd5141fa806ea2f1aead972a
```
The response is the docker network id, which can be found later if needed (it won't be!) with `docker network ls --no-trunc`

The compose files are then:

### traefik\docker-compose.yml
```
 version: "3"
 services:
   traefik:
     image: "traefik:v2.5.4"
     command:
       - --entrypoints.web.address=:80
       - --providers.docker=true
       - --providers.docker.defaultRule=Host(`app.mydomain.com`) && PathPrefix(`/{{ index .Labels "com.docker.compose.service" }}`)
     ports:
       - "80:80"
     volumes:
       - "/var/run/docker.sock:/var/run/docker.sock:ro"
    networks:
      - proxy
networks:
  proxy:
    external: true
    name: proxy
```

### app1\docker-compose.yml

```
 version: "3"
 services:
   app1:
     image: containous/whoami:v1.3.0
    networks:
      - proxy
networks:
  proxy:
    external: true
    name: proxy
```

and the startup goes like this:

```
/traefik# docker-compose up -d
Creating traefik ... done
~/traefik# cd ../app1
~/app1# docker-compose up -d
Creating app1 ... done
```

A shutdown can also proceed smoothly:

```
~/app1# docker-compose down
Stopping app1 ... done
Removing app1 ... done
Network proxy is external, skipping
```

## Thanks

The solution was arrived at based on this [stack overflow question](https://stackoverflow.com/q/38088279/2738122).

But none of the answers were quite right for me.

[This answer](https://stackoverflow.com/a/48024244/2738122) was probably closest and has the traefik container auto-creating the proxy network (it doesn't have `external: true`) and the other containers just joining it (they do have `external: true`).

It makes some sense because without traefik running, external access to any of the services would be broken anyway.  However it wouldn't be possible to restart traefik (e.g. to upgrade it) as it would try to remove the network which would be "in use".  It also relies on traefik being the first container up and I'm not convinced that can always be guaranteed, thus the solution given solves these issues, at the "cost" of having to one-time run a simple extra command.
