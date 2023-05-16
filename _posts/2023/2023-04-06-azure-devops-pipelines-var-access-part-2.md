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

Trying to get to the bottom of all this, a variable group
`CICD_VAR_TEST`, was created with these values (but with the “SECRET” ones
actually made secret!):

{%- capture _lib_var_group_table_options -%}
{
    headercells: true,
    columns: [
        { title: "Name", datafield: "Name" },
        { title: "Value", datafield: "Value" }
    ],
    data: [
      {Name:'CICD_OVERRIDE_VALUE',Value: 'TTTOverrideValue'},
      {Name:'CICD_SECRET_OVERRIDE_VALUE',Value: 'TTTSecretOverrideValue'},
      {Name:'CICD_SECRET_VALUE',Value: 'TTTSecretValue'},
      {Name:'CICD_VALUE',Value: 'TTTValue'}
    ]
}
{%- endcapture -%}
{% include datatable.html id="lib_var_group_table" options=_lib_var_group_table_options %}

The following pipeline and template files were used:

### azure_pipelines.yml

```yaml
parameters:
- name: CICD_TestParam
  type: string
variables:
- name: CICD_Literal
  value: "TTTPipelineLiteral"
- group: CICD_VAR_TEST

trigger: none

name: test.0.0$(Rev:.r)

resources:
  repositories:
    - repository: CICD
      type: git
      name: CICD/CICD
      ref: GKE_AKS_Support

pool: vmss-agentpool-linux-v2

stages:
- template: testing/test_vars_stages.yml@CICD
  parameters: 
     CICD_OVERRIDE_VALUE: "TTTNewValue"
     CICD_SECRET_OVERRIDE_VALUE: "TTTNewSecretValue"
     PARAMLibrary1: $(CICD_VALUE)
     PARAMLibrary2: ${{variables.CICD_VALUE}}
     PARAMLibrary3: $[variables.CICD_VALUE]
     PARAMLibrarySecret1: $(CICD_SECRET_VALUE)
     PARAMLibrarySecret2: ${{variables.CICD_SECRET_VALUE}}
     PARAMLibrarySecret3: $[variables.CICD_SECRET_VALUE]
     PARAMAssigned1: $(CICD_Literal)
     PARAMAssigned2: ${{variables.CICD_Literal}}
     PARAMAssigned3: $[variables.CICD_Literal]
     PARAMMissing1: $(DOES_NOT_EXIST)
     PARAMMissing2: ${{variables.DOES_NOT_EXIST}}
     PARAMMissing3: $[variables.DOES_NOT_EXIST]
     PARAMLiteral: "TTTLiteral"
     PARAMEmpty: " "
     PARAMParam: ${{parameters.CICD_TestParam}}
```

### test_var_stages.yml

```yaml
#--------------------------------------------
parameters:
- name: CICD_OVERRIDE_VALUE
  type: string
- name: CICD_SECRET_OVERRIDE_VALUE
  type: string
- name: PARAMLibrary1
  type: string
- name: PARAMLibrary2
  type: string
- name: PARAMLibrary3
  type: string
- name: PARAMLibrarySecret1
  type: string
- name: PARAMLibrarySecret2
  type: string
- name: PARAMLibrarySecret3
  type: string
- name: PARAMAssigned1
  type: string
- name: PARAMAssigned2
  type: string
- name: PARAMAssigned3
  type: string
- name: PARAMMissing1
  type: string
- name: PARAMMissing2
  type: string
- name: PARAMMissing3
  type: string
- name: PARAMLiteral
  type: string
- name: PARAMEmpty
  type: string
- name: PARAMParam
  type: string
- name: PARAMDefaulted
  type: string
  default: "TTTDefault"
#--------------------------------------------

stages:
- stage: VarsTest
  jobs:
  - deployment: varsTest
    variables:
      VAR_PARAMLibrary1: "${{parameters.PARAMLibrary1}}"
      VAR_PARAMLibrary2: "${{parameters.PARAMLibrary2}}"
      VAR_PARAMLibrary3: "${{parameters.PARAMLibrary3}}"
      VAR_PARAMLibrarySecret1: "${{parameters.PARAMLibrarySecret1}}"
      VAR_PARAMLibrarySecret2: "${{parameters.PARAMLibrarySecret2}}"
      VAR_PARAMLibrarySecret3: "${{parameters.PARAMLibrarySecret3}}"
      VAR_PARAMAssigned1: "${{parameters.PARAMAssigned1}}"
      VAR_PARAMAssigned2: "${{parameters.PARAMAssigned2}}"
      VAR_PARAMAssigned3: "${{parameters.PARAMAssigned3}}"
      VAR_PARAMMissing1: "${{parameters.PARAMMissing1}}"
      VAR_PARAMMissing2: "${{parameters.PARAMMissing2}}"
      VAR_PARAMMissing3: "${{parameters.PARAMMissing3}}"
      VAR_PARAMLiteral: "${{parameters.PARAMLiteral}}"
      VAR_PARAMEmpty: "${{parameters.PARAMEmpty}}"
      VAR_PARAMParam: "${{parameters.PARAMParam}}"
      VAR_PARAMDefaulted: "${{parameters.PARAMDefaulted}}"
      VAR_Literal: "TTTVAR"
    environment: dv
    displayName: varsTest
    strategy:
      runOnce:
        deploy:
          steps:
          - bash: |
              echo "  PARAMLibrary1='${PARAMLibrary1}'"
              echo "  PARAMLibrary2='${PARAMLibrary2}'"
              echo "  PARAMLibrary3='${PARAMLibrary3}'"
              echo "  PARAMLibrarySecret1='${PARAMLibrarySecret1}'"
              echo "  PARAMLibrarySecret2='${PARAMLibrarySecret2}'"
              echo "  PARAMLibrarySecret3='${PARAMLibrarySecret3}'"
              echo "  PARAMAssigned1='${PARAMAssigned1}'"
              echo "  PARAMAssigned2='${PARAMAssigned2}'"
              echo "  PARAMAssigned3='${PARAMAssigned3}'"
              echo "  PARAMMissing1='${PARAMMissing1}'"
              echo "  PARAMMissing2='${PARAMMissing2}'"
              echo "  PARAMMissing3='${PARAMMissing3}'"
              echo "  PARAMLiteral='${PARAMLiteral}'"
              echo "  PARAMEmpty='${PARAMEmpty}'"
              echo "  PARAMParam='${PARAMParam}'"
              echo "  PARAMDefaulted='${PARAMDefaulted}'"
              echo "---"
              echo "  CICD_OVERRIDE_VALUE='${CICD_OVERRIDE_VALUE}'"
              echo "  CICD_SECRET_OVERRIDE_VALUE='${CICD_SECRET_OVERRIDE_VALUE}'"
              echo "  SH_CICD_OVERRIDE_VALUE='${SH_CICD_OVERRIDE_VALUE}'"
              echo "  SH_CICD_SECRET_OVERRIDE_VALUE='${SH_CICD_SECRET_OVERRIDE_VALUE}'"
              echo "---"
              echo "  VAR_PARAMLibrary1='${VAR_PARAMLibrary1}'"
              echo "  VAR_PARAMLibrary2='${VAR_PARAMLibrary2}'"
              echo "  VAR_PARAMLibrary3='${VAR_PARAMLibrary3}'"
              echo "  VAR_PARAMLibrarySecret1='${VAR_PARAMLibrarySecret1}'"
              echo "  VAR_PARAMLibrarySecret2='${VAR_PARAMLibrarySecret2}'"
              echo "  VAR_PARAMLibrarySecret3='${VAR_PARAMLibrarySecret3}'"
              echo "  VAR_PARAMAssigned1='${VAR_PARAMAssigned1}'"
              echo "  VAR_PARAMAssigned2='${VAR_PARAMAssigned2}'"
              echo "  VAR_PARAMAssigned3='${VAR_PARAMAssigned3}'"
              echo "  VAR_PARAMMissing1='${VAR_PARAMMissing1}'"
              echo "  VAR_PARAMMissing2='${VAR_PARAMMissing2}'"
              echo "  VAR_PARAMMissing3='${VAR_PARAMMissing3}'"
              echo "  VAR_PARAMLiteral='${VAR_PARAMLiteral}'"
              echo "  VAR_PARAMEmpty='${VAR_PARAMEmpty}'"
              echo "  VAR_PARAMParam='${VAR_PARAMParam}'"
              echo "  VAR_PARAMDefaulted='${VAR_PARAMDefaulted}'"
              echo "  VAR_Literal='${VAR_Literal}'"
              echo "---"
              echo "  VAR1_PARAMLibrary1='$(VAR_PARAMLibrary1)'"
              echo "  VAR1_PARAMLibrary2='$(VAR_PARAMLibrary2)'"
              echo "  VAR1_PARAMLibrary3='$(VAR_PARAMLibrary3)'"
              echo "  VAR1_PARAMLibrarySecret1='$(VAR_PARAMLibrarySecret1)'"
              echo "  VAR1_PARAMLibrarySecret2='$(VAR_PARAMLibrarySecret2)'"
              echo "  VAR1_PARAMLibrarySecret3='$(VAR_PARAMLibrarySecret3)'"
              echo "  VAR1_PARAMAssigned1='$(VAR_PARAMAssigned1)'"
              echo "  VAR1_PARAMAssigned2='$(VAR_PARAMAssigned2)'"
              echo "  VAR1_PARAMAssigned3='$(VAR_PARAMAssigned3)'"
              echo "  VAR1_PARAMMissing1='$(VAR_PARAMMissing1)'"
              echo "  VAR1_PARAMMissing2='$(VAR_PARAMMissing2)'"
              echo "  VAR1_PARAMMissing3='$(VAR_PARAMMissing3)'"
              echo "  VAR1_PARAMLiteral='$(VAR_PARAMLiteral)'"
              echo "  VAR1_PARAMEmpty='$(VAR_PARAMEmpty)'"
              echo "  VAR1_PARAMParam='$(VAR_PARAMParam)'"
              echo "  VAR1_PARAMDefaulted='$(VAR_PARAMDefaulted)'"
              echo "  VAR1_Literal='$(VAR_Literal)'"
              echo "---"
              echo "  VAR2_PARAMLibrary1='${{variables.VAR_PARAMLibrary1}}'"
              echo "  VAR2_PARAMLibrary2='${{variables.VAR_PARAMLibrary2}}'"
              echo "  VAR2_PARAMLibrary3='${{variables.VAR_PARAMLibrary3}}'"
              echo "  VAR2_PARAMLibrarySecret1='${{variables.VAR_PARAMLibrarySecret1}}'"
              echo "  VAR2_PARAMLibrarySecret2='${{variables.VAR_PARAMLibrarySecret2}}'"
              echo "  VAR2_PARAMLibrarySecret3='${{variables.VAR_PARAMLibrarySecret3}}'"
              echo "  VAR2_PARAMAssigned1='${{variables.VAR_PARAMAssigned1}}'"
              echo "  VAR2_PARAMAssigned2='${{variables.VAR_PARAMAssigned2}}'"
              echo "  VAR2_PARAMAssigned3='${{variables.VAR_PARAMAssigned3}}'"
              echo "  VAR2_PARAMMissing1='${{variables.VAR_PARAMMissing1}}'"
              echo "  VAR2_PARAMMissing2='${{variables.VAR_PARAMMissing2}}'"
              echo "  VAR2_PARAMMissing3='${{variables.VAR_PARAMMissing3}}'"
              echo "  VAR2_PARAMLiteral='${{variables.VAR_PARAMLiteral}}'"
              echo "  VAR2_PARAMEmpty='${{variables.VAR_PARAMEmpty}}'"
              echo "  VAR2_PARAMParam='${{variables.VAR_PARAMParam}}'"
              echo "  VAR2_PARAMDefaulted='${{variables.VAR_PARAMDefaulted}}'"
              echo "  VAR2_Literal='${{variables.VAR_Literal}}'"
              echo "---"
              echo "  VAR3_PARAMLibrary1='$[variables.VAR_PARAMLibrary1]'"
              echo "  VAR3_PARAMLibrary2='$[variables.VAR_PARAMLibrary2]'"
              echo "  VAR3_PARAMLibrary3='$[variables.VAR_PARAMLibrary3]'"
              echo "  VAR3_PARAMLibrarySecret1='$[variables.VAR_PARAMLibrarySecret1]'"
              echo "  VAR3_PARAMLibrarySecret2='$[variables.VAR_PARAMLibrarySecret2]'"
              echo "  VAR3_PARAMLibrarySecret3='$[variables.VAR_PARAMLibrarySecret3]'"
              echo "  VAR3_PARAMAssigned1='$[variables.VAR_PARAMAssigned1]'"
              echo "  VAR3_PARAMAssigned2='$[variables.VAR_PARAMAssigned2]'"
              echo "  VAR3_PARAMAssigned3='$[variables.VAR_PARAMAssigned3]'"
              echo "  VAR3_PARAMMissing1='$[variables.VAR_PARAMMissing1]'"
              echo "  VAR3_PARAMMissing2='$[variables.VAR_PARAMMissing2]'"
              echo "  VAR3_PARAMMissing3='$[variables.VAR_PARAMMissing3]'"
              echo "  VAR3_PARAMLiteral='$[variables.VAR_PARAMLiteral]'"
              echo "  VAR3_PARAMEmpty='$[variables.VAR_PARAMEmpty]'"
              echo "  VAR3_PARAMParam='$[variables.VAR_PARAMParam]'"
              echo "  VAR3_PARAMDefaulted='$[variables.VAR_PARAMDefaulted]'"
              echo "  VAR3_Literal='$[variables.VAR_Literal]'"
              echo "---"
              echo "  SH_PARAMLibrary1='${SH_PARAMLibrary1}'"
              echo "  SH_PARAMLibrary2='${SH_PARAMLibrary2}'"
              echo "  SH_PARAMLibrary3='${SH_PARAMLibrary3}'"
              echo "  SH_PARAMLibrarySecret1='${SH_PARAMLibrarySecret1}'"
              echo "  SH_PARAMLibrarySecret2='${SH_PARAMLibrarySecret2}'"
              echo "  SH_PARAMLibrarySecret3='${SH_PARAMLibrarySecret3}'"
              echo "  SH_PARAMAssigned1='${SH_PARAMAssigned1}'"
              echo "  SH_PARAMAssigned2='${SH_PARAMAssigned2}'"
              echo "  SH_PARAMAssigned3='${SH_PARAMAssigned3}'"
              echo "  SH_PARAMMissing1='${SH_PARAMMissing1}'"
              echo "  SH_PARAMMissing2='${SH_PARAMMissing2}'"
              echo "  SH_PARAMMissing3='${SH_PARAMMissing3}'"
              echo "  SH_PARAMLiteral='${SH_PARAMLiteral}'"
              echo "  SH_PARAMEmpty='${SH_PARAMEmpty}'"
              echo "  SH_PARAMParam='${SH_PARAMParam}'"
              echo "  SH_PARAMDefaulted='${SH_PARAMDefaulted}'"
              echo "---"
              echo "  SH_VAR1_PARAMLibrary1='${SH_VAR1_PARAMLibrary1}'"
              echo "  SH_VAR1_PARAMLibrary2='${SH_VAR1_PARAMLibrary2}'"
              echo "  SH_VAR1_PARAMLibrary3='${SH_VAR1_PARAMLibrary3}'"
              echo "  SH_VAR1_PARAMLibrarySecret1='${SH_VAR1_PARAMLibrarySecret1}'"
              echo "  SH_VAR1_PARAMLibrarySecret2='${SH_VAR1_PARAMLibrarySecret2}'"
              echo "  SH_VAR1_PARAMLibrarySecret3='${SH_VAR1_PARAMLibrarySecret3}'"
              echo "  SH_VAR1_PARAMAssigned1='${SH_VAR1_PARAMAssigned1}'"
              echo "  SH_VAR1_PARAMAssigned2='${SH_VAR1_PARAMAssigned2}'"
              echo "  SH_VAR1_PARAMAssigned3='${SH_VAR1_PARAMAssigned3}'"
              echo "  SH_VAR1_PARAMMissing1='${SH_VAR1_PARAMMissing1}'"
              echo "  SH_VAR1_PARAMMissing2='${SH_VAR1_PARAMMissing2}'"
              echo "  SH_VAR1_PARAMMissing3='${SH_VAR1_PARAMMissing3}'"
              echo "  SH_VAR1_PARAMLiteral='${SH_VAR1_PARAMLiteral}'"
              echo "  SH_VAR1_PARAMEmpty='${SH_VAR1_PARAMEmpty}'"
              echo "  SH_VAR1_PARAMParam='${SH_VAR1_PARAMParam}'"
              echo "  SH_VAR1_PARAMDefaulted='${SH_VAR1_PARAMDefaulted}'"
              echo "---"
              echo "  SH_VAR2_PARAMLibrary1='${SH_VAR2_PARAMLibrary1}'"
              echo "  SH_VAR2_PARAMLibrary2='${SH_VAR2_PARAMLibrary2}'"
              echo "  SH_VAR2_PARAMLibrary3='${SH_VAR2_PARAMLibrary3}'"
              echo "  SH_VAR2_PARAMLibrarySecret1='${SH_VAR2_PARAMLibrarySecret1}'"
              echo "  SH_VAR2_PARAMLibrarySecret2='${SH_VAR2_PARAMLibrarySecret2}'"
              echo "  SH_VAR2_PARAMLibrarySecret3='${SH_VAR2_PARAMLibrarySecret3}'"
              echo "  SH_VAR2_PARAMAssigned1='${SH_VAR2_PARAMAssigned1}'"
              echo "  SH_VAR2_PARAMAssigned2='${SH_VAR2_PARAMAssigned2}'"
              echo "  SH_VAR2_PARAMAssigned3='${SH_VAR2_PARAMAssigned3}'"
              echo "  SH_VAR2_PARAMMissing1='${SH_VAR2_PARAMMissing1}'"
              echo "  SH_VAR2_PARAMMissing2='${SH_VAR2_PARAMMissing2}'"
              echo "  SH_VAR2_PARAMMissing3='${SH_VAR2_PARAMMissing3}'"
              echo "  SH_VAR2_PARAMLiteral='${SH_VAR2_PARAMLiteral}'"
              echo "  SH_VAR2_PARAMEmpty='${SH_VAR2_PARAMEmpty}'"
              echo "  SH_VAR2_PARAMParam='${SH_VAR2_PARAMParam}'"
              echo "  SH_VAR2_PARAMDefaulted='${SH_VAR2_PARAMDefaulted}'"
              echo "---"
              echo "  SH_VAR3_PARAMLibrary1='${SH_VAR3_PARAMLibrary1}'"
              echo "  SH_VAR3_PARAMLibrary2='${SH_VAR3_PARAMLibrary2}'"
              echo "  SH_VAR3_PARAMLibrary3='${SH_VAR3_PARAMLibrary3}'"
              echo "  SH_VAR3_PARAMLibrarySecret1='${SH_VAR3_PARAMLibrarySecret1}'"
              echo "  SH_VAR3_PARAMLibrarySecret2='${SH_VAR3_PARAMLibrarySecret2}'"
              echo "  SH_VAR3_PARAMLibrarySecret3='${SH_VAR3_PARAMLibrarySecret3}'"
              echo "  SH_VAR3_PARAMAssigned1='${SH_VAR3_PARAMAssigned1}'"
              echo "  SH_VAR3_PARAMAssigned2='${SH_VAR3_PARAMAssigned2}'"
              echo "  SH_VAR3_PARAMAssigned3='${SH_VAR3_PARAMAssigned3}'"
              echo "  SH_VAR3_PARAMMissing1='${SH_VAR3_PARAMMissing1}'"
              echo "  SH_VAR3_PARAMMissing2='${SH_VAR3_PARAMMissing2}'"
              echo "  SH_VAR3_PARAMMissing3='${SH_VAR3_PARAMMissing3}'"
              echo "  SH_VAR3_PARAMLiteral='${SH_VAR3_PARAMLiteral}'"
              echo "  SH_VAR3_PARAMEmpty='${SH_VAR3_PARAMEmpty}'"
              echo "  SH_VAR3_PARAMParam='${SH_VAR3_PARAMParam}'"
              echo "  SH_VAR3_PARAMDefaulted='${SH_VAR3_PARAMDefaulted}'"
              #pline fail   echo "---"
              #pline fail   echo "  SH_VAR_PARAMLibrary1='${SH_VAR_PARAMLibrary1}'"
              #pline fail   echo "  SH_VAR_PARAMLibrary2='${SH_VAR_PARAMLibrary2}'"
              #pline fail   echo "  SH_VAR_PARAMLibrary3='${SH_VAR_PARAMLibrary3}'"
              #pline fail   echo "  SH_VAR_PARAMLibrarySecret1='${SH_VAR_PARAMLibrarySecret1}'"
              #pline fail   echo "  SH_VAR_PARAMLibrarySecret2='${SH_VAR_PARAMLibrarySecret2}'"
              #pline fail   echo "  SH_VAR_PARAMLibrarySecret3='${SH_VAR_PARAMLibrarySecret3}'"
              #pline fail   echo "  SH_VAR_PARAMAssigned1='${SH_VAR_PARAMAssigned1}'"
              #pline fail   echo "  SH_VAR_PARAMAssigned2='${SH_VAR_PARAMAssigned2}'"
              #pline fail   echo "  SH_VAR_PARAMAssigned3='${SH_VAR_PARAMAssigned3}'"
              #pline fail   echo "  SH_VAR_PARAMMissing1='${SH_VAR_PARAMMissing1}'"
              #pline fail   echo "  SH_VAR_PARAMMissing2='${SH_VAR_PARAMMissing2}'"
              #pline fail   echo "  SH_VAR_PARAMMissing3='${SH_VAR_PARAMMissing3}'"
              #pline fail   echo "  SH_VAR_PARAMLiteral='${SH_VAR_PARAMLiteral}'"
              #pline fail   echo "  SH_VAR_PARAMEmpty='${SH_VAR_PARAMEmpty}'"
              #pline fail   echo "  SH_VAR_PARAMParam='${SH_VAR_PARAMParam}'"
              #pline fail   echo "  SH_VAR_PARAMDefaulted='${SH_VAR_PARAMDefaulted}'"
              echo "---"
              echo "  SH_VAR1_VAR_PARAMLibrary1='${SH_VAR1_VAR_PARAMLibrary1}'"
              echo "  SH_VAR1_VAR_PARAMLibrary2='${SH_VAR1_VAR_PARAMLibrary2}'"
              echo "  SH_VAR1_VAR_PARAMLibrary3='${SH_VAR1_VAR_PARAMLibrary3}'"
              echo "  SH_VAR1_VAR_PARAMLibrarySecret1='${SH_VAR1_VAR_PARAMLibrarySecret1}'"
              echo "  SH_VAR1_VAR_PARAMLibrarySecret2='${SH_VAR1_VAR_PARAMLibrarySecret2}'"
              echo "  SH_VAR1_VAR_PARAMLibrarySecret3='${SH_VAR1_VAR_PARAMLibrarySecret3}'"
              echo "  SH_VAR1_VAR_PARAMAssigned1='${SH_VAR1_VAR_PARAMAssigned1}'"
              echo "  SH_VAR1_VAR_PARAMAssigned2='${SH_VAR1_VAR_PARAMAssigned2}'"
              echo "  SH_VAR1_VAR_PARAMAssigned3='${SH_VAR1_VAR_PARAMAssigned3}'"
              echo "  SH_VAR1_VAR_PARAMMissing1='${SH_VAR1_VAR_PARAMMissing1}'"
              echo "  SH_VAR1_VAR_PARAMMissing2='${SH_VAR1_VAR_PARAMMissing2}'"
              echo "  SH_VAR1_VAR_PARAMMissing3='${SH_VAR1_VAR_PARAMMissing3}'"
              echo "  SH_VAR1_VAR_PARAMLiteral='${SH_VAR1_VAR_PARAMLiteral}'"
              echo "  SH_VAR1_VAR_PARAMEmpty='${SH_VAR1_VAR_PARAMEmpty}'"
              echo "  SH_VAR1_VAR_PARAMParam='${SH_VAR1_VAR_PARAMParam}'"
              echo "  SH_VAR1_VAR_PARAMDefaulted='${SH_VAR1_VAR_PARAMDefaulted}'"
              echo "  SH_VAR1_VAR_Literal='${SH_VAR1_VAR_Literal}'"
              echo "---"
              echo "  SH_VAR2_VAR_PARAMLibrary1='${SH_VAR2_VAR_PARAMLibrary1}'"
              echo "  SH_VAR2_VAR_PARAMLibrary2='${SH_VAR2_VAR_PARAMLibrary2}'"
              echo "  SH_VAR2_VAR_PARAMLibrary3='${SH_VAR2_VAR_PARAMLibrary3}'"
              echo "  SH_VAR2_VAR_PARAMLibrarySecret1='${SH_VAR2_VAR_PARAMLibrarySecret1}'"
              echo "  SH_VAR2_VAR_PARAMLibrarySecret2='${SH_VAR2_VAR_PARAMLibrarySecret2}'"
              echo "  SH_VAR2_VAR_PARAMLibrarySecret3='${SH_VAR2_VAR_PARAMLibrarySecret3}'"
              echo "  SH_VAR2_VAR_PARAMAssigned1='${SH_VAR2_VAR_PARAMAssigned1}'"
              echo "  SH_VAR2_VAR_PARAMAssigned2='${SH_VAR2_VAR_PARAMAssigned2}'"
              echo "  SH_VAR2_VAR_PARAMAssigned3='${SH_VAR2_VAR_PARAMAssigned3}'"
              echo "  SH_VAR2_VAR_PARAMMissing1='${SH_VAR2_VAR_PARAMMissing1}'"
              echo "  SH_VAR2_VAR_PARAMMissing2='${SH_VAR2_VAR_PARAMMissing2}'"
              echo "  SH_VAR2_VAR_PARAMMissing3='${SH_VAR2_VAR_PARAMMissing3}'"
              echo "  SH_VAR2_VAR_PARAMLiteral='${SH_VAR2_VAR_PARAMLiteral}'"
              echo "  SH_VAR2_VAR_PARAMEmpty='${SH_VAR2_VAR_PARAMEmpty}'"
              echo "  SH_VAR2_VAR_PARAMParam='${SH_VAR2_VAR_PARAMParam}'"
              echo "  SH_VAR2_VAR_PARAMDefaulted='${SH_VAR2_VAR_PARAMDefaulted}'"
              echo "  SH_VAR2_VAR_Literal='${SH_VAR2_VAR_Literal}'"
              echo "---"
              echo "  SH_VAR3_VAR_PARAMLibrary1='${SH_VAR3_VAR_PARAMLibrary1}'"
              echo "  SH_VAR3_VAR_PARAMLibrary2='${SH_VAR3_VAR_PARAMLibrary2}'"
              echo "  SH_VAR3_VAR_PARAMLibrary3='${SH_VAR3_VAR_PARAMLibrary3}'"
              echo "  SH_VAR3_VAR_PARAMLibrarySecret1='${SH_VAR3_VAR_PARAMLibrarySecret1}'"
              echo "  SH_VAR3_VAR_PARAMLibrarySecret2='${SH_VAR3_VAR_PARAMLibrarySecret2}'"
              echo "  SH_VAR3_VAR_PARAMLibrarySecret3='${SH_VAR3_VAR_PARAMLibrarySecret3}'"
              echo "  SH_VAR3_VAR_PARAMAssigned1='${SH_VAR3_VAR_PARAMAssigned1}'"
              echo "  SH_VAR3_VAR_PARAMAssigned2='${SH_VAR3_VAR_PARAMAssigned2}'"
              echo "  SH_VAR3_VAR_PARAMAssigned3='${SH_VAR3_VAR_PARAMAssigned3}'"
              echo "  SH_VAR3_VAR_PARAMMissing1='${SH_VAR3_VAR_PARAMMissing1}'"
              echo "  SH_VAR3_VAR_PARAMMissing2='${SH_VAR3_VAR_PARAMMissing2}'"
              echo "  SH_VAR3_VAR_PARAMMissing3='${SH_VAR3_VAR_PARAMMissing3}'"
              echo "  SH_VAR3_VAR_PARAMLiteral='${SH_VAR3_VAR_PARAMLiteral}'"
              echo "  SH_VAR3_VAR_PARAMEmpty='${SH_VAR3_VAR_PARAMEmpty}'"
              echo "  SH_VAR3_VAR_PARAMParam='${SH_VAR3_VAR_PARAMParam}'"
              echo "  SH_VAR3_VAR_PARAMDefaulted='${SH_VAR3_VAR_PARAMDefaulted}'"
              echo "  SH_VAR3_VAR_Literal='${SH_VAR3_VAR_Literal}'"
              echo "==="
              echo "env:"
              echo "---"
              env | grep 'PARAM\|VAR\|CICD' | sort
              echo "---"
              echo "==="
            displayName: Show ALL
            env:
              CICD_OVERRIDE_VALUE: "${{parameters.CICD_OVERRIDE_VALUE}}"
              CICD_SECRET_OVERRIDE_VALUE: "${{parameters.CICD_SECRET_OVERRIDE_VALUE}}"
              SH_CICD_OVERRIDE_VALUE: "${{parameters.CICD_OVERRIDE_VALUE}}"
              SH_CICD_SECRET_OVERRIDE_VALUE: "${{parameters.CICD_SECRET_OVERRIDE_VALUE}}"
              SH_PARAMLibrary1: "${{parameters.PARAMLibrary1}}"
              SH_PARAMLibrary2: "${{parameters.PARAMLibrary2}}"
              SH_PARAMLibrary3: "${{parameters.PARAMLibrary3}}"
              SH_PARAMLibrarySecret1: "${{parameters.PARAMLibrarySecret1}}"
              SH_PARAMLibrarySecret2: "${{parameters.PARAMLibrarySecret2}}"
              SH_PARAMLibrarySecret3: "${{parameters.PARAMLibrarySecret3}}"
              SH_PARAMAssigned1: "${{parameters.PARAMAssigned1}}"
              SH_PARAMAssigned2: "${{parameters.PARAMAssigned2}}"
              SH_PARAMAssigned3: "${{parameters.PARAMAssigned3}}"
              SH_PARAMMissing1: "${{parameters.PARAMMissing1}}"
              SH_PARAMMissing2: "${{parameters.PARAMMissing2}}"
              SH_PARAMMissing3: "${{parameters.PARAMMissing3}}"
              SH_PARAMLiteral: "${{parameters.PARAMLiteral}}"
              SH_PARAMEmpty: "${{parameters.PARAMEmpty}}"
              SH_PARAMParam: "${{parameters.PARAMParam}}"
              SH_PARAMDefaulted: "${{parameters.PARAMDefaulted}}"
              SH_VAR1_PARAMLibrary1: "$(PARAMLibrary1)"
              SH_VAR1_PARAMLibrary2: "$(PARAMLibrary2)"
              SH_VAR1_PARAMLibrary3: "$(PARAMLibrary3)"
              SH_VAR1_PARAMLibrarySecret1: "$(PARAMLibrarySecret1)"
              SH_VAR1_PARAMLibrarySecret2: "$(PARAMLibrarySecret2)"
              SH_VAR1_PARAMLibrarySecret3: "$(PARAMLibrarySecret3)"
              SH_VAR1_PARAMAssigned1: "$(PARAMAssigned1)"
              SH_VAR1_PARAMAssigned2: "$(PARAMAssigned2)"
              SH_VAR1_PARAMAssigned3: "$(PARAMAssigned3)"
              SH_VAR1_PARAMMissing1: "$(PARAMMissing1)"
              SH_VAR1_PARAMMissing2: "$(PARAMMissing2)"
              SH_VAR1_PARAMMissing3: "$(PARAMMissing3)"
              SH_VAR1_PARAMLiteral: "$(PARAMLiteral)"
              SH_VAR1_PARAMEmpty: "$(PARAMEmpty)"
              SH_VAR1_PARAMParam: "$(PARAMParam)"
              SH_VAR1_PARAMDefaulted: "$(PARAMDefaulted)"
              SH_VAR2_PARAMLibrary1: "${{variables.PARAMLibrary1}}"
              SH_VAR2_PARAMLibrary2: "${{variables.PARAMLibrary2}}"
              SH_VAR2_PARAMLibrary3: "${{variables.PARAMLibrary3}}"
              SH_VAR2_PARAMLibrarySecret1: "${{variables.PARAMLibrarySecret1}}"
              SH_VAR2_PARAMLibrarySecret2: "${{variables.PARAMLibrarySecret2}}"
              SH_VAR2_PARAMLibrarySecret3: "${{variables.PARAMLibrarySecret3}}"
              SH_VAR2_PARAMAssigned1: "${{variables.PARAMAssigned1}}"
              SH_VAR2_PARAMAssigned2: "${{variables.PARAMAssigned2}}"
              SH_VAR2_PARAMAssigned3: "${{variables.PARAMAssigned3}}"
              SH_VAR2_PARAMMissing1: "${{variables.PARAMMissing1}}"
              SH_VAR2_PARAMMissing2: "${{variables.PARAMMissing2}}"
              SH_VAR2_PARAMMissing3: "${{variables.PARAMMissing3}}"
              SH_VAR2_PARAMLiteral: "${{variables.PARAMLiteral}}"
              SH_VAR2_PARAMEmpty: "${{variables.PARAMEmpty}}"
              SH_VAR2_PARAMParam: "${{variables.PARAMParam}}"
              SH_VAR2_PARAMDefaulted: "${{variables.PARAMDefaulted}}"
              SH_VAR3_PARAMLibrary1: "$[variables.PARAMLibrary1]"
              SH_VAR3_PARAMLibrary2: "$[variables.PARAMLibrary2]"
              SH_VAR3_PARAMLibrary3: "$[variables.PARAMLibrary3]"
              SH_VAR3_PARAMLibrarySecret1: "$[variables.PARAMLibrarySecret1]"
              SH_VAR3_PARAMLibrarySecret2: "$[variables.PARAMLibrarySecret2]"
              SH_VAR3_PARAMLibrarySecret3: "$[variables.PARAMLibrarySecret3]"
              SH_VAR3_PARAMAssigned1: "$[variables.PARAMAssigned1]"
              SH_VAR3_PARAMAssigned2: "$[variables.PARAMAssigned2]"
              SH_VAR3_PARAMAssigned3: "$[variables.PARAMAssigned3]"
              SH_VAR3_PARAMMissing1: "$[variables.PARAMMissing1]"
              SH_VAR3_PARAMMissing2: "$[variables.PARAMMissing2]"
              SH_VAR3_PARAMMissing3: "$[variables.PARAMMissing3]"
              SH_VAR3_PARAMLiteral: "$[variables.PARAMLiteral]"
              SH_VAR3_PARAMEmpty: "$[variables.PARAMEmpty]"
              SH_VAR3_PARAMParam: "$[variables.PARAMParam]"
              SH_VAR3_PARAMDefaulted: "$[variables.PARAMDefaulted]"
#pline fail   SH_VAR_PARAMLibrary1: "${{parameters.VAR_PARAMLibrary1}}"
#pline fail   SH_VAR_PARAMLibrary2: "${{parameters.VAR_PARAMLibrary2}}"
#pline fail   SH_VAR_PARAMLibrary3: "${{parameters.VAR_PARAMLibrary3}}"
#pline fail   SH_VAR_PARAMLibrarySecret1: "${{parameters.VAR_PARAMLibrarySecret1}}"
#pline fail   SH_VAR_PARAMLibrarySecret2: "${{parameters.VAR_PARAMLibrarySecret2}}"
#pline fail   SH_VAR_PARAMLibrarySecret3: "${{parameters.VAR_PARAMLibrarySecret3}}"
#pline fail   SH_VAR_PARAMAssigned1: "${{parameters.VAR_PARAMAssigned1}}"
#pline fail   SH_VAR_PARAMAssigned2: "${{parameters.VAR_PARAMAssigned2}}"
#pline fail   SH_VAR_PARAMAssigned3: "${{parameters.VAR_PARAMAssigned3}}"
#pline fail   SH_VAR_PARAMMissing1: "${{parameters.VAR_PARAMMissing1}}"
#pline fail   SH_VAR_PARAMMissing2: "${{parameters.VAR_PARAMMissing2}}"
#pline fail   SH_VAR_PARAMMissing3: "${{parameters.VAR_PARAMMissing3}}"
#pline fail   SH_VAR_PARAMLiteral: "${{parameters.VAR_PARAMLiteral}}"
#pline fail   SH_VAR_PARAMEmpty: "${{parameters.VAR_PARAMEmpty}}"
#pline fail   SH_VAR_PARAMParam: "${{parameters.VAR_PARAMParam}}"
#pline fail   SH_VAR_PARAMDefaulted: "${{parameters.VAR_PARAMDefaulted}}"
              SH_VAR1_VAR_PARAMLibrary1: "$(VAR_PARAMLibrary1)"
              SH_VAR1_VAR_PARAMLibrary2: "$(VAR_PARAMLibrary2)"
              SH_VAR1_VAR_PARAMLibrary3: "$(VAR_PARAMLibrary3)"
              SH_VAR1_VAR_PARAMLibrarySecret1: "$(VAR_PARAMLibrarySecret1)"
              SH_VAR1_VAR_PARAMLibrarySecret2: "$(VAR_PARAMLibrarySecret2)"
              SH_VAR1_VAR_PARAMLibrarySecret3: "$(VAR_PARAMLibrarySecret3)"
              SH_VAR1_VAR_PARAMAssigned1: "$(VAR_PARAMAssigned1)"
              SH_VAR1_VAR_PARAMAssigned2: "$(VAR_PARAMAssigned2)"
              SH_VAR1_VAR_PARAMAssigned3: "$(VAR_PARAMAssigned3)"
              SH_VAR1_VAR_PARAMMissing1: "$(VAR_PARAMMissing1)"
              SH_VAR1_VAR_PARAMMissing2: "$(VAR_PARAMMissing2)"
              SH_VAR1_VAR_PARAMMissing3: "$(VAR_PARAMMissing3)"
              SH_VAR1_VAR_PARAMLiteral: "$(VAR_PARAMLiteral)"
              SH_VAR1_VAR_PARAMEmpty: "$(VAR_PARAMEmpty)"
              SH_VAR1_VAR_PARAMParam: "$(VAR_PARAMParam)"
              SH_VAR1_VAR_PARAMDefaulted: "$(VAR_PARAMDefaulted)"
              SH_VAR1_VAR_Literal: "$(VAR_PARAMLiteral)"
              SH_VAR2_VAR_PARAMLibrary1: "${{variables.VAR_PARAMLibrary1}}"
              SH_VAR2_VAR_PARAMLibrary2: "${{variables.VAR_PARAMLibrary2}}"
              SH_VAR2_VAR_PARAMLibrary3: "${{variables.VAR_PARAMLibrary3}}"
              SH_VAR2_VAR_PARAMLibrarySecret1: "${{variables.VAR_PARAMLibrarySecret1}}"
              SH_VAR2_VAR_PARAMLibrarySecret2: "${{variables.VAR_PARAMLibrarySecret2}}"
              SH_VAR2_VAR_PARAMLibrarySecret3: "${{variables.VAR_PARAMLibrarySecret3}}"
              SH_VAR2_VAR_PARAMAssigned1: "${{variables.VAR_PARAMAssigned1}}"
              SH_VAR2_VAR_PARAMAssigned2: "${{variables.VAR_PARAMAssigned2}}"
              SH_VAR2_VAR_PARAMAssigned3: "${{variables.VAR_PARAMAssigned3}}"
              SH_VAR2_VAR_PARAMMissing1: "${{variables.VAR_PARAMMissing1}}"
              SH_VAR2_VAR_PARAMMissing2: "${{variables.VAR_PARAMMissing2}}"
              SH_VAR2_VAR_PARAMMissing3: "${{variables.VAR_PARAMMissing3}}"
              SH_VAR2_VAR_PARAMLiteral: "${{variables.VAR_PARAMLiteral}}"
              SH_VAR2_VAR_PARAMEmpty: "${{variables.VAR_PARAMEmpty}}"
              SH_VAR2_VAR_PARAMParam: "${{variables.VAR_PARAMParam}}"
              SH_VAR2_VAR_PARAMDefaulted: "${{variables.VAR_PARAMDefaulted}}"
              SH_VAR2_VAR_Literal: "${{variables.VAR_Literal}}"
              SH_VAR3_VAR_PARAMLibrary1: "$[variables.VAR_PARAMLibrary1]"
              SH_VAR3_VAR_PARAMLibrary2: "$[variables.VAR_PARAMLibrary2]"
              SH_VAR3_VAR_PARAMLibrary3: "$[variables.VAR_PARAMLibrary3]"
              SH_VAR3_VAR_PARAMLibrarySecret1: "$[variables.VAR_PARAMLibrarySecret1]"
              SH_VAR3_VAR_PARAMLibrarySecret2: "$[variables.VAR_PARAMLibrarySecret2]"
              SH_VAR3_VAR_PARAMLibrarySecret3: "$[variables.VAR_PARAMLibrarySecret3]"
              SH_VAR3_VAR_PARAMAssigned1: "$[variables.VAR_PARAMAssigned1]"
              SH_VAR3_VAR_PARAMAssigned2: "$[variables.VAR_PARAMAssigned2]"
              SH_VAR3_VAR_PARAMAssigned3: "$[variables.VAR_PARAMAssigned3]"
              SH_VAR3_VAR_PARAMMissing1: "$[variables.VAR_PARAMMissing1]"
              SH_VAR3_VAR_PARAMMissing2: "$[variables.VAR_PARAMMissing2]"
              SH_VAR3_VAR_PARAMMissing3: "$[variables.VAR_PARAMMissing3]"
              SH_VAR3_VAR_PARAMLiteral: "$[variables.VAR_PARAMLiteral]"
              SH_VAR3_VAR_PARAMEmpty: "$[variables.VAR_PARAMEmpty]"
              SH_VAR3_VAR_PARAMParam: "$[variables.VAR_PARAMParam]"
              SH_VAR3_VAR_PARAMDefaulted: "$[variables.VAR_PARAMDefaulted]"
              SH_VAR3_VAR_Literal: "$[variables.VAR_Literal]"

          - ? ${{ if notin(parameters.CICD_OVERRIDE_VALUE, '', ' ')}}
            : - bash: |
                  echo "CICD_OVERRIDE_VALUE not empty"
                displayName: correct CICD_OVERRIDE_VALUE not empty
          - ? ${{ if in(parameters.CICD_OVERRIDE_VALUE, '', ' ')}}
            : - bash: |
                  echo "CICD_OVERRIDE_VALUE empty"
                displayName: WRONG CICD_OVERRIDE_VALUE empty


          - ? ${{ if notin(parameters.CICD_SECRET_OVERRIDE_VALUE, '', ' ')}}
            : - bash: |
                  echo "CICD_SECRET_OVERRIDE_VALUE not empty"
                displayName: correct CICD_SECRET_OVERRIDE_VALUE not empty
          - ? ${{ if in(parameters.CICD_SECRET_OVERRIDE_VALUE, '', ' ')}}
            : - bash: |
                  echo "CICD_SECRET_OVERRIDE_VALUE empty"
                displayName: WRONG CICD_SECRET_OVERRIDE_VALUE empty


          - ? ${{ if notin(parameters.PARAMLibrary1, '', ' ')}}
            : - bash: |
                  echo "PARAMLibrary1 not empty"
                displayName: correct PARAMLibrary1 not empty
          - ? ${{ if in(parameters.PARAMLibrary1, '', ' ')}}
            : - bash: |
                  echo "PARAMLibrary1 empty"
                displayName: WRONG PARAMLibrary1 empty


          - ? ${{ if notin(parameters.PARAMLibrary2, '', ' ')}}
            : - bash: |
                  echo "PARAMLibrary2 not empty"
                displayName: correct PARAMLibrary2 not empty
          - ? ${{ if in(parameters.PARAMLibrary2, '', ' ')}}
            : - bash: |
                  echo "PARAMLibrary2 empty"
                displayName: WRONG PARAMLibrary2 empty


          - ? ${{ if notin(parameters.PARAMLibrary3, '', ' ')}}
            : - bash: |
                  echo "PARAMLibrary3 not empty"
                displayName: correct PARAMLibrary3 not empty
          - ? ${{ if in(parameters.PARAMLibrary3, '', ' ')}}
            : - bash: |
                  echo "PARAMLibrary3 empty"
                displayName: WRONG PARAMLibrary3 empty


          - ? ${{ if notin(parameters.PARAMLibrarySecret1, '', ' ')}}
            : - bash: |
                  echo "PARAMLibrarySecret1 not empty"
                displayName: correct PARAMLibrarySecret1 not empty
          - ? ${{ if in(parameters.PARAMLibrarySecret1, '', ' ')}}
            : - bash: |
                  echo "PARAMLibrarySecret1 empty"
                displayName: WRONG PARAMLibrarySecret1 empty


          - ? ${{ if notin(parameters.PARAMLibrarySecret2, '', ' ')}}
            : - bash: |
                  echo "PARAMLibrarySecret2 not empty"
                displayName: correct PARAMLibrarySecret2 not empty
          - ? ${{ if in(parameters.PARAMLibrarySecret2, '', ' ')}}
            : - bash: |
                  echo "PARAMLibrarySecret2 empty"
                displayName: WRONG PARAMLibrarySecret2 empty


          - ? ${{ if notin(parameters.PARAMLibrarySecret3, '', ' ')}}
            : - bash: |
                  echo "PARAMLibrarySecret3 not empty"
                displayName: correct PARAMLibrarySecret3 not empty
          - ? ${{ if in(parameters.PARAMLibrarySecret3, '', ' ')}}
            : - bash: |
                  echo "PARAMLibrarySecret3 empty"
                displayName: WRONG PARAMLibrarySecret3 empty


          - ? ${{ if notin(parameters.PARAMAssigned1, '', ' ')}}
            : - bash: |
                  echo "PARAMAssigned1 not empty"
                displayName: correct PARAMAssigned1 not empty
          - ? ${{ if in(parameters.PARAMAssigned1, '', ' ')}}
            : - bash: |
                  echo "PARAMAssigned1 empty"
                displayName: WRONG PARAMAssigned1 empty


          - ? ${{ if notin(parameters.PARAMAssigned2, '', ' ')}}
            : - bash: |
                  echo "PARAMAssigned2 not empty"
                displayName: correct PARAMAssigned2 not empty
          - ? ${{ if in(parameters.PARAMAssigned2, '', ' ')}}
            : - bash: |
                  echo "PARAMAssigned2 empty"
                displayName: WRONG PARAMAssigned2 empty


          - ? ${{ if notin(parameters.PARAMAssigned3, '', ' ')}}
            : - bash: |
                  echo "PARAMAssigned3 not empty"
                displayName: correct PARAMAssigned3 not empty
          - ? ${{ if in(parameters.PARAMAssigned3, '', ' ')}}
            : - bash: |
                  echo "PARAMAssigned3 empty"
                displayName: WRONG PARAMAssigned3 empty


          - ? ${{ if notin(parameters.PARAMMissing1, '', ' ')}}
            : - bash: |
                  echo "PARAMMissing1 not empty"
                displayName: correct PARAMMissing1 not empty
          - ? ${{ if in(parameters.PARAMMissing1, '', ' ')}}
            : - bash: |
                  echo "PARAMMissing1 empty"
                displayName: WRONG PARAMMissing1 empty


          - ? ${{ if notin(parameters.PARAMMissing2, '', ' ')}}
            : - bash: |
                  echo "PARAMMissing2 not empty"
                displayName: correct PARAMMissing2 not empty
          - ? ${{ if in(parameters.PARAMMissing2, '', ' ')}}
            : - bash: |
                  echo "PARAMMissing2 empty"
                displayName: WRONG PARAMMissing2 empty


          - ? ${{ if notin(parameters.PARAMMissing3, '', ' ')}}
            : - bash: |
                  echo "PARAMMissing3 not empty"
                displayName: correct PARAMMissing3 not empty
          - ? ${{ if in(parameters.PARAMMissing3, '', ' ')}}
            : - bash: |
                  echo "PARAMMissing3 empty"
                displayName: WRONG PARAMMissing3 empty


          - ? ${{ if notin(parameters.PARAMLiteral, '', ' ')}}
            : - bash: |
                  echo "PARAMLiteral not empty"
                displayName: correct PARAMLiteral not empty
          - ? ${{ if in(parameters.PARAMLiteral, '', ' ')}}
            : - bash: |
                  echo "PARAMLiteral empty"
                displayName: WRONG PARAMLiteral empty


          - ? ${{ if notin(parameters.PARAMEmpty, '', ' ')}}
            : - bash: |
                  echo "PARAMEmpty not empty"
                displayName: WRONG PARAMEmpty not empty
          - ? ${{ if in(parameters.PARAMEmpty, '', ' ')}}
            : - bash: |
                  echo "PARAMEmpty empty"
                displayName: correct PARAMEmpty empty


          - ? ${{ if notin(parameters.PARAMParam, '', ' ')}}
            : - bash: |
                  echo "PARAMParam not empty"
                displayName: correct PARAMParam not empty
          - ? ${{ if in(parameters.PARAMParam, '', ' ')}}
            : - bash: |
                  echo "PARAMParam empty"
                displayName: WRONG PARAMParam empty


          - ? ${{ if notin(parameters.PARAMDefaulted, '', ' ')}}
            : - bash: |
                  echo "PARAMDefaulted not empty"
                displayName: correct PARAMDefaulted not empty
          - ? ${{ if in(parameters.PARAMDefaulted, '', ' ')}}
            : - bash: |
                  echo "PARAMDefaulted empty"
                displayName: WRONG PARAMDefaulted empty





          - ? ${{ if ne(parameters.CICD_OVERRIDE_VALUE, 'TTTNewValue')}}
            : - bash: |
                  echo "CICD_OVERRIDE_VALUE incorrect value"
                displayName: WRONG CICD_OVERRIDE_VALUE value
          - ? ${{ if eq(parameters.CICD_OVERRIDE_VALUE, 'TTTNewValue')}}
            : - bash: |
                  echo "CICD_OVERRIDE_VALUE correct value"
                displayName: correct CICD_OVERRIDE_VALUE value


          - ? ${{ if ne(parameters.CICD_SECRET_OVERRIDE_VALUE, 'TTTNewSecretValue')}}
            : - bash: |
                  echo "CICD_SECRET_OVERRIDE_VALUE incorrect value"
                displayName: WRONG CICD_SECRET_OVERRIDE_VALUE value
          - ? ${{ if eq(parameters.CICD_SECRET_OVERRIDE_VALUE, 'TTTNewSecretValue')}}
            : - bash: |
                  echo "CICD_SECRET_OVERRIDE_VALUE correct value"
                displayName: correct CICD_SECRET_OVERRIDE_VALUE value


          - ? ${{ if ne(parameters.PARAMLibrary1, 'TTTValue')}}
            : - bash: |
                  echo "PARAMLibrary1 incorrect value"
                displayName: WRONG PARAMLibrary1 value
          - ? ${{ if eq(parameters.PARAMLibrary1, 'TTTValue')}}
            : - bash: |
                  echo "PARAMLibrary1 correct value"
                displayName: correct PARAMLibrary1 value


          - ? ${{ if ne(parameters.PARAMLibrary2, 'TTTValue')}}
            : - bash: |
                  echo "PARAMLibrary2 incorrect value"
                displayName: WRONG PARAMLibrary2 value
          - ? ${{ if eq(parameters.PARAMLibrary2, 'TTTValue')}}
            : - bash: |
                  echo "PARAMLibrary2 correct value"
                displayName: correct PARAMLibrary2 value


          - ? ${{ if ne(parameters.PARAMLibrary3, 'TTTValue')}}
            : - bash: |
                  echo "PARAMLibrary3 incorrect value"
                displayName: WRONG PARAMLibrary3 value
          - ? ${{ if eq(parameters.PARAMLibrary3, 'TTTValue')}}
            : - bash: |
                  echo "PARAMLibrary3 correct value"
                displayName: correct PARAMLibrary3 value



          - ? ${{ if ne(parameters.PARAMLibrarySecret1, 'TTTSecretValue')}}
            : - bash: |
                  echo "PARAMLibrarySecret1 incorrect value"
                displayName: WRONG PARAMLibrarySecret1 value
          - ? ${{ if eq(parameters.PARAMLibrarySecret1, 'TTTSecretValue')}}
            : - bash: |
                  echo "PARAMLibrarySecret1 correct value"
                displayName: correct PARAMLibrarySecret1 value


          - ? ${{ if ne(parameters.PARAMLibrarySecret2, 'TTTSecretValue')}}
            : - bash: |
                  echo "PARAMLibrarySecret2 incorrect value"
                displayName: WRONG PARAMLibrarySecret2 value
          - ? ${{ if eq(parameters.PARAMLibrarySecret2, 'TTTSecretValue')}}
            : - bash: |
                  echo "PARAMLibrarySecret2 correct value"
                displayName: correct PARAMLibrarySecret2 value


          - ? ${{ if ne(parameters.PARAMLibrarySecret3, 'TTTSecretValue')}}
            : - bash: |
                  echo "PARAMLibrarySecret3 incorrect value"
                displayName: WRONG PARAMLibrarySecret3 value
          - ? ${{ if eq(parameters.PARAMLibrarySecret3, 'TTTSecretValue')}}
            : - bash: |
                  echo "PARAMLibrarySecret3 correct value"
                displayName: correct PARAMLibrarySecret3 value



          - ? ${{ if ne(parameters.PARAMAssigned1, 'TTTPipelineLiteral')}}
            : - bash: |
                  echo "PARAMAssigned1 incorrect value"
                displayName: WRONG PARAMAssigned1 value
          - ? ${{ if eq(parameters.PARAMAssigned1, 'TTTPipelineLiteral')}}
            : - bash: |
                  echo "PARAMAssigned1 correct value"
                displayName: correct PARAMAssigned1 value


          - ? ${{ if ne(parameters.PARAMAssigned2, 'TTTPipelineLiteral')}}
            : - bash: |
                  echo "PARAMAssigned2 incorrect value"
                displayName: WRONG PARAMAssigned2 value
          - ? ${{ if eq(parameters.PARAMAssigned2, 'TTTPipelineLiteral')}}
            : - bash: |
                  echo "PARAMAssigned2 correct value"
                displayName: correct PARAMAssigned2 value


          - ? ${{ if ne(parameters.PARAMAssigned3, 'TTTPipelineLiteral')}}
            : - bash: |
                  echo "PARAMAssigned3 incorrect value"
                displayName: WRONG PARAMAssigned3 value
          - ? ${{ if eq(parameters.PARAMAssigned3, 'TTTPipelineLiteral')}}
            : - bash: |
                  echo "PARAMAssigned3 correct value"
                displayName: correct PARAMAssigned3 value


          - ? ${{ if ne(parameters.PARAMMissing1, '')}}
            : - bash: |
                  echo "PARAMMissing1 incorrect value"
                displayName: WRONG PARAMMissing1 value
          - ? ${{ if eq(parameters.PARAMMissing1, '')}}
            : - bash: |
                  echo "PARAMMissing1 correct value"
                displayName: correct PARAMMissing1 value


          - ? ${{ if ne(parameters.PARAMMissing2, '')}}
            : - bash: |
                  echo "PARAMMissing2 incorrect value"
                displayName: WRONG PARAMMissing2 value
          - ? ${{ if eq(parameters.PARAMMissing2, '')}}
            : - bash: |
                  echo "PARAMMissing2 correct value"
                displayName: correct PARAMMissing2 value


          - ? ${{ if ne(parameters.PARAMMissing3, '')}}
            : - bash: |
                  echo "PARAMMissing3 incorrect value"
                displayName: WRONG PARAMMissing3 value
          - ? ${{ if eq(parameters.PARAMMissing3, '')}}
            : - bash: |
                  echo "PARAMMissing3 correct value"
                displayName: correct PARAMMissing3 value


          - ? ${{ if ne(parameters.PARAMLiteral, 'TTTLiteral')}}
            : - bash: |
                  echo "PARAMLiteral incorrect value"
                displayName: WRONG PARAMLiteral value
          - ? ${{ if eq(parameters.PARAMLiteral, 'TTTLiteral')}}
            : - bash: |
                  echo "PARAMLiteral correct value"
                displayName: correct PARAMLiteral value


          - ? ${{ if ne(parameters.PARAMEmpty, ' ')}}
            : - bash: |
                  echo "PARAMEmpty incorrect value"
                displayName: WRONG PARAMEmpty value
          - ? ${{ if eq(parameters.PARAMEmpty, ' ')}}
            : - bash: |
                  echo "PARAMEmpty correct value"
                displayName: correct PARAMEmpty value


          - ? ${{ if ne(parameters.PARAMParam, 'TTTUI')}}
            : - bash: |
                  echo "PARAMParam incorrect value"
                displayName: WRONG PARAMParam value
          - ? ${{ if eq(parameters.PARAMParam, 'TTTUI')}}
            : - bash: |
                  echo "PARAMParam correct value"
                displayName: correct PARAMParam value


          - ? ${{ if ne(parameters.PARAMDefaulted, 'TTTDefault')}}
            : - bash: |
                  echo "PARAMDefaulted incorrect value"
                displayName: WRONG PARAMDefaulted value
          - ? ${{ if eq(parameters.PARAMDefaulted, 'TTTDefault')}}
            : - bash: |
                  echo "PARAMDefaulted correct value"
                displayName: correct PARAMDefaulted value



#- ? ${{ if notin(parameters.CICD_GCP_PROJECT, '', ' ')}}
#            : - bash: echo "not empty"
#                displayName: correct 

```

### Analysis

Logs from this run show the inconsistency of variable population between
runtime and compiletime, and analysis will reveal the best approach: 
[click here to download ado_pipeline_var_logs_90792.zip]({{ site.baseurl }}/data/ado_pipeline_var_logs_90792.zip)

Analysis excel worksheet producted from this: [click here to download AzurePipelineVarsAnalysis.xlsx]({{ site.baseurl }}/data/AzurePipelineVarsAnalysis.xlsx).

### Thanks

Some partly-useful docs at:

-   [Define variables - Azure Pipelines](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/variables?view=azure-devops&tabs=yaml%2Cbatch#runtime-expression-syntax)
-   [Use runtime and type-safe parameters - Azure Pipelines](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/runtime-parameters?view=azure-devops&tabs=script)