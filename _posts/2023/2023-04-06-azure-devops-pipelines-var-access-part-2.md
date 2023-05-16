---
title: azure devops pipelines var access part 2
#subtitle: more than the title
#excerpt: This is what the page is really about
tags: [quicktips,azure,devops,pipelines,variables]
jsit: true
---
How to access Azure devops pipelines variables and parameters in a way
that is reliable both in a script and in template conditions
<!--more-->

## Intro

Finding a reliable way to accessing Azure devops pipelines variables and pass 
them to templates as parameters can be tricky. Particularly when needing both
access in a shell script and in adding conditional steps to a template using 
the `- ? {{ if ...}}` construct.

In the previous post [azure devops pipelines var access]({{site.url}}/azure-devops-pipelines-var-access)
attention was turned to access of script-generated vars between stages, jobs
and steps.

In this post it's focussing on reliable access at both "compile time" and
"runtime" and in predictably dealing with unset variables.

## Suggested Guidelines

{% raw %}
For anything that needs to be used in a template conditional step check 
`- ? {{ if ...}}` construct, the value cannot be from a Library Variable Group.
This means anywhere up the chain of parameter passing or variable 
assignment/reassignment.  It’s probably best for the caller to use a literal
value for the param.  If it can’t be literal, it must be from a
literally-defined variable (not library variable group value), or a pipeline
param entered by user or defaulted.

To prevent issues with Library Variable Group keys with the same name as a
variable causing the value to be changed when using in a script, reassign a
parameter or variable to an env var of a different name - e.g. prefix with
`SH_`.

Within an inline shell script only refer to the env var in usual script format 
`$SH_VAR` or `${SH_VAR}`.  Do not use `$(VAR)`, `$[variables.VAR]` or 
`{{variables[VAR]}}` anywhere within an inline shell script.

So for example do:

```yaml
parameters:
- name: my_param
  type: string

- variables:
  name: my_var
  type: string

...

- bash: |
    echo "my param: ${SH_my_param}"
    echo "my var: ${SH_my_var}
  env:
    SH_my_param: ${{parameters.my_param}}
    SH_my_var: $(my_var)
```

There is only one possible syntax to access a parameter value - 
`${{parameters.my_param}}`.

Use the `$(my_var)` syntax, to access a variable value to pass to a parameter or
a shell env var.  Given that this stays literal "$(my_var)" if `my_var` is not
defined, if necessary use a utility script to check for likely azure devops 
pipeline formats that may indicate an expected replacement has not occured. e.g.

```bash
function cicd_pipeline_value_is_set
{
   pipelineValue=$1

   [[ ! -z $(echo $pipelineValue) ]] \
      && [[ ! $pipelineValue =~ ^\$\(.*\)$ ]] \
      && [[ ! $pipelineValue =~ ^\$\[variables\..*\]$ ]] \
      && [[ ! $pipelineValue =~ ^\$\{\{variables\..*\}\}$ ]] \
      && [[ ! $pipelineValue =~ ^\$\{\{parameters\..*\}\}$ ]]
}
```

and use it in a script with something like:

```yaml
- bash: |
    cicd_pipeline_value_is_set $SH_my_var || export SH_my_var=''
    ...
  env:
    SH_my_var: $(my_var)
```

Note that the value of `my_var` may not match the name of the variable and
therefore the name of the `SH_` var.  For instance caller might do 
`host_param: $(does_not_exist)` so if our script does 
`env: sh_host_param: $(host_param)` the script can’t check if the value is set
to `"$(host_param)"` as a value, because it won’t be, it will have a value of 
`"$(does_not_exist)"` which is entirely down to the caller.
{% endraw %}

## Deep dive

Trying to get to the bottom of all this, I created a variable group
`CICD_VAR_TEST`, which has these values (but with the “SECRET” ones actually
made secret!):

{%- capture _lib_var_group_table_options -%}
{
    headercells: true,
    columns: [
        { title: "Name", datafield: "Name" },
        { title: "Value", datafield: "Value" }
    ]
}
{%- endcapture -%}
{% include datatable.html id="lib_var_group_table" data="[{Name:'CICD_OVERRIDE_VALUE',Value: 'TTTOverrideValue'},{Name:'CICD_SECRET_OVERRIDE_VALUE',Value: 'TTTSecretOverrideValue'},{Name:'CICD_SECRET_VALUE',Value: 'TTTSecretValue'},{Name:'CICD_VALUE',Value: 'TTTValue'}]" options=_lib_var_group_table_options %}