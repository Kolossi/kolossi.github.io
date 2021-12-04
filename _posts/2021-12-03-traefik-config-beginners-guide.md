---
title: Traefik config beginners guide
tags: [quicktips,traefik,docker]
---
Traefik configuration can be confusing for a newbie, to understand it, read this guide...
<!--more-->

I posted the following [question on stackoverflow](https://stackoverflow.com/q/70158137) and also on the [Traefik community site](https://community.traefik.io/t/please-help-traefik-newby-with-basic-default-config/12554):


> ### Traefik docker config path-based routing with rewriting
> 2-day-old newbie to traefik, needing help with what istm is a basic first docker provider config in traefik v2...
> 
> I've tried searching through the docs, but just can't figure out how to do what I'm after.
> 
> I'd like to have docker containers like
> 
> * app1
> * app2
> * app3
> 
> And have these accessed through traefik via the urls
> 
> * `http://app.mydomain.com/app1`
> * `http://app.mydomain.com/app2`
> * `http://app.mydomain.com/app3`
> 
> However the apps themselves don't like these extra paths, so I'd like strip the prefix from the access paths so the apps don't see them.
> 
> If I access `http://app.mydomain.com/app2/foo` I'd like container `app2` to get the request `http://{container.ip.addr}}/foo`
> 
> As a repro, the config I do know partially works is having the following in my traefik `docker-compose.yml`:
> 
> ```
> version: "3"
> services:
>   traefik:
>     image: "traefik:v2.5.4"
>     command:
>       - --entrypoints.web.address=:80
>       - --providers.docker=true
>       - --api
>       - --api.insecure=true
>       - --api.dashboard=true
>       - --providers.file.directory=/etc/traefik/dynamic
>       - --providers.docker.defaultRule=Host(`app.mydomain.com`) && PathPrefix(`/{{ index .Labels "com.docker.compose.service" }}`)
>     ports:
>       - "80:80"
>       - "8080:8080"
>     volumes:
>       - "/var/run/docker.sock:/var/run/docker.sock:ro"
> 
>   app1:
>     image: containous/whoami:v1.3.0
>   app2:
>     image: containous/whoami:v1.3.0
>   app3:
>     image: containous/whoami:v1.3.0
> ```
> 
> Having added `127.0.0.1 app.mydomain.com` to `\etc\hosts`, doing a curl to `http://app.mydomain.com/app{1,2,3}/foo` this routes to the correct service, but the request path they receive is `/app1/foo`, `/app2/foo`, `/app3/foo` whereas I'd like them all to get `/foo`. 
> 
> I feel like I'd like to be able to add the following to the command line params in the docker-compose:
> 
> ```
> --providers.docker.middleware.default-stripprefix.stripprefix.prefixes=`/{{ index .Labels "com.docker.compose.service" }}`
> ```
> but it doesnt work (error: `command traefik error: failed to decode configuration from flags: field not found, node: middleware`)
> 
> I can't find any docs that indicate what the correct commandline param(s) might be.
> 
> I'm thinking it might need to be in a dynamic config file (I've seen that too messing with tls config, but want to keep all that out of the repro at this stage!) but again can't seem to find what the correct config would be for a default middleware.
> 
> I can find lots of refs (and get it working) where I have to specify it in labels on each container, but I'd prefer just to default this out with one-time entries in the traefik config itself.
> 
> I've been bashing my head against this for 2 days now. I've tried searching the docs site, this community and the googleverse but without luck.  It seems like such a "101" config to me! :-)
> 
> Please would someone help me not only solve my issue but optionally teach me how I could have found the solution myself in the docs site.  I've seen plenty of mentions of the doc site being good, but they seem quite sparse to me for v2.

Sadly I didn't get any response (at time of writing this).

But I carried on digging and I think I've finally figured out what I needed.

The TL;DR to the question I posed was that the "default middleware" can only be defined in a Traefik v2 "dynamic configuration", which means using a separate config file.

### Static vs Dynamic Configuration
Traefik v2* has what it terms "static" configuration and "dynamic" configuration.

> :information_source: *I've joined as a Traefik user only after v2, so the breaking changes between v1 and v2 are out of scope here, and nothing here can be taken as any relevance to v1.  Maybe some of it's right in v1 too, but I have no idea!

Dynamic configuration is determined by "providers". These providers include ones like:

* docker
* kubernetes
* file
* etc.

Dynamic configuration seems obvious when it comes to things like determining all the available services - e.g.the docker provider inspects the docker environment to determine this, it's dynamic configuration. Seems to make sense.

The file provider means that config can be set in a config file (or files), but that's not the same as the static configuration.

This is important - Static vs Dynamic configuration is not an "either/or" approach in Traefik v2.  A given type of config value can be defined in only the correct one of Static or Dynamic configuration.

The Traefik diagram at the top of the [Configuration Introduction page](https://doc.traefik.io/traefik/v2.5/getting-started/configuration-overview/) kinda hints at this but for me doesn't make it clear at all. The diagram filename is even `static-dynamic-configuration.png`!

{::options parse_block_html="true" /}
<div class="share-links shadowtb">
  ![Static Dynamic Configuration](https://doc.traefik.io/traefik/assets/img/static-dynamic-configuration.png){:class="img-center"}
</div>


It shows that Static vs Dynamic is about whether it's "startup time" or "while running".

But to answer the problem in the question posted, what is needed is to define a "StripPrefix" middleware and then refer to this in the entrypoint configuration.

However as the diagram shows, any middleware definition must be in Dynamic configuration and the endpoint configuration is in the Static configuration.  (Just for added fun, ofc the dynamic config file needs to be referenced by an entry in the static configuration!)

In other words the "startup time" config includes references to things only created in the "while running" config.  Hmm.

### Secret Sauce

Even when finding a relevant bit of config in the [Traefik docs](https://doc.traefik.io/traefik/), it gives example config which always includes an example in yaml or toml file format, but it wasn't obvious to me whether this is referring to static or dynamic config file, until I figured this "secret sauce" trick! ...

I now realise that if it's endpoint or "provider connection information" then it will be in static configuration, otherwise it will probably be dynamic configuration, but there is a better way:

Static configuration can be given by one of:

* [environment variables](https://doc.traefik.io/traefik/reference/static-configuration/env/)
* a config file
* [command line parameters](https://doc.traefik.io/traefik/reference/static-configuration/cli/) (aka CLI)

This last one is the key - if the example formats to specify the value include "CLI" then it will be Static configuration, if not then it must be in a Dynamic configuration file.

There are quite a lot of places where the example config includes `## Static configuration` or `## Dynamic configuration` at the top but, certainly at time of writing, it is not consistent.  It's also easy to miss the significance of this until you understand.

## The answer to the StripPrefix problem

To solve the problem, a dynamic config file is needed.  Personal preference is that since everything can't be command line args, I'd prefer not to use them for the static config, so I end up with 3 files:
* `docker-compose.yml`
* Static configuration `traefik.yml` this is mounted in the standard Traefik location `/etc/traefik/traefik.yml` so is picked up without needing to be specified
* Dynamic configuration `dynamic.yml` this is referred to in the static configuration
 
### docker-compose.yml

```
version: "3"
services:
  traefik:
    image: "traefik:v2.5.4"
    ports:
      - "80:80"
      - "8080:8080"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "{path}/traefik.yml:/etc/traefik/traefik.yml:ro"
      - "{path}/dynamic.yml:/etc/traefik/dynamic.yml:ro"

  app1:
    image: containous/whoami:v1.3.0
  app2:
    image: containous/whoami:v1.3.0
  app3:
    image: containous/whoami:v1.3.0

```

### traefik.yml

```
api:
  insecure: true
  dashboard: true
providers:
  docker:
    defaultRule: "Host(`app.mydomain.com`) && PathPrefix(`/{{ index .Labels \"com.docker.compose.service\" }}`)"
  file:
    filename: "/etc/traefik/dynamic.yml"
entrypoints:
  web:
    address: ":80"
    http:
      middlewares:
        - root-stripprefix@file
```

### dynamic.yml

```
http:
  middlewares:
    root-stripprefix:
      stripPrefixRegex:
        regex:
          - "/[^/]+"
```

The dynamic configuration specifies a StripPrefix middleware - I've actually used StripPrefixRegex to grab whatever is in the first part of the path without having to specify it.

This middleware is then associated with the web endpoint so it applies to everything using it.

This solves the issue fairly simply but it was quite a journey of understanding the Traefik docs and config system before being able to get there.

## See also
* [Traefik Docker network setup]({{site.url}}/traefik-docker-network-setup).