---
title: azure devops pipelines var access
#subtitle: more than the title
#excerpt: This is what the page is really about
tags: [quicktips,azure,devops,pipelines,variables]
---
How to access Azure devops pipelines variables set with a
`##vso[task.setvariable ...` output from other tasks, jobs, deployments and
stages...
<!--more-->

## Intro

Variables can be set in Azure Devops Pipelines (aka ADP) by outputing lines of the
following form to stdout during a task (here bash but can be powershell,
external program etc):

```bash
    echo '##vso[task.setvariable variable=MyVar;isOutput=true]'MyValue
    echo '##vso[task.setvariable variable=MyVarNotOutput]'MyOtherValue
```

Variables set with `isOutput=true` can be used in other jobs, deployments and
stages.  Without it, they can only be used in tasks in the same job/deployment.

The format used to access the variable varies - sometimes completely, sometimes
subtly - depending on whether:
- isOutput is used,
- whether the step that _defined_ the variable is in a job or a deployment
- whether the accessing step is in the same job/deployment or further afield.

## Suggested Solutions

To use an ADP variable in a script, pass it to the script by way of an
environment variable (see [Deep dive](#deep-dive)).

If the variable is set in another job, deployment, or stage, then it will first
need to declare this as a dependecy, and then retrieve the value from the
dependency into a variable within the current job or deployment.

With these approaches, it shouldn't matter whether or not  the variable
definition is performed in a template.

|   |defined _without_ `isoutput=true`|defined with `isoutput=true` in a job step|defined with `isoutput=true` in a deployment step|
|---|---|---|---|
|Access in another task in same job or deployment| `$(MyVar)` |`$(SetValueStepName.MyVar)`| `$(SetVarStepName.MyVar)` |
|Access in another job/deployment|:x:| set job/deployment `dependsOn: SetValueJobName`<br/><br/>create a job/deployment variable with<br/>`MyNewVar: $[ dependencies.SetValueJobName`<br/>`.outputs['SetValueStepName.MyVar'] ]` | set job/deployment `dependsOn: SetValueDeployName`<br/><br/>create a job/deployment variable with<br/>`MyNewVar: $[ dependencies.SetValueDeployName`<br/>`.outputs['SetValueDeployName.SetValueStepName.MyVar'] ]` |
|Access in another stage| :x: | set stage `dependsOn: SetValueStageName`<br/><br/>create a stage/job/deployment variable with<br/>`MyNewVar: $[ stageDependencies.SetValueStageName.SetValueJobName`<br/>`.outputs['SetValueStepName.MyVar'] ]` | set stage `dependsOn: SetValueStageName`<br/><br/>create a stage/job/deployment variable with<br/>`MyNewVar: $[ stageDependencies.SetValueStageName.SetValueDeployName`<br/>`.outputs['SetValueDeployName.SetValueStepName.MyVar'] ]` |

Notes:
1. when the value is defined in a deployment step, the retrieval from dependency needs the deploy name both before AND within the `.outputs` section.

1. the change from `dependencies.` to `stageDependencies.` when the value is defined in a separate stage

The (kinda) logic for the change of syntax for deployments is that if a deployment strategy other than "run_once" is used, there might be multiple runs of that deployment, and each might have a different variable value, so they need to be specified.  It is what it is.

## Deep dive

In order to access values in bash scripts, it's possible to have ADP replace
the values into inline scripts before they are executed, but this can be
problematic and should be avoided, favour passing the values to the
script using environment variables, which are in turn populated from ADP
variables.

One of the problems with the in-script replacement is the way ADP deals with the
replacements if the variable is not found.

One format for declaring a value to be replaced by ADP is `$(variableName)`.
However bash uses this same format to mean "execute the command(s) in brackets
and use the output as the result". e.g. 

```bash
export filesHere=$(ls -1)
```

So in order to not break existing scripts, if ADP can't find a matching
variable, it leaves this expression untouched, otherwise replacing it.
This is fine for

```bash
echo 'Hello $(name)'
```

It will just give an error if `name` is underfined.  But what if a script author
decided to initiate a reboot only if varaible `reboot` is set to true? :

```bash
[[ $(reboot) == "true" ]] && reboot
```

Unfortunately, if there is no ADP variable `reboot` then the script will be
unchanged and in order to evaluate `$(reboot)` bash will execute the reboot
command on the agent.  An extreme example and still likely to fail due to
perms, but shows the problems with this approach.  It's also why if the variable
does not exist, the error from a bash script `echo $(MyVar)` can be something
along the lines of `MyVar: Command not found`.

{% raw %}
Other syntax for variable replacement exist such as `${{ variables.reboot }}` or
`$[ variables.reboot ]` but these have their own inconsistencies, including
whether they resolve at "compile time" (when a pipeline is being prepared to
run) or "runtime", and whether they are intended for conditions & expressions
or other uses such as scripts and other variable values. In fact they are
sometimes actually replace with `$(reboot)` "under the hood" on a first pass
before acting as above.
{% endraw %}
 
See [Define variables](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/variables?view=azure-devops&tabs=yaml%2Cbatch) for more details.

## Example

So the proposed way to use a value from say another job in a script is:

```yaml
jobs:
- job: SetValueJob
  tasks:
  - bash: |
      echo '##vso[task.setvariable variable=MyVar;isOutput=true]'MyValue
    name: SetValueTask
- job: DisplayValueJob
  dependencies:
  - SetValueJob
  variables:
    MyGotVar: $[ dependencies.SetValueJob.outputs['SetValueStep.MyVar'] ]
  steps:
  - bash: |
      set -euo pipefail
      echo "I got the value ${Env_MyGotVar}"
    env:
      Env_MyGotVar: $(MyGotVar)
```

This way, the problems with the `$(...)` syntax are avoided as they are not
within the script only in the world of ADP. The use of the defensive
`set -euo pipefail` at the top of the script will raise an error in a number of
cases, including if the envirnoment var reffered to is not set -
e.g. due to typo.

If the variable is not set in ADP, it won't perform a replacement, so the value 
will be literal `$(MyGotVar)` but importantly, bash will not try to
further evaluate it.

Naming conventions for "got" vars from other stages/jobs/deployments, and the
env version of the var, should probably be formalised, and the choices above 
made just to clarify what is where.

## Investigation Example


 Here's a complete (and slightly mad) pipeline used to find and confirm the
 above answers for all of this:

```yaml
#--------------------------------------------
parameters:
#---------------defaulted--------------------
- name: myJobValue
  type: string
  default: "MyJobPropogationValue"
- name: myDeployValue
  type: string
  default: "MyDeployPropogationValue"
- name: env
  type: string
  default: "dv"
#--------------------------------------------

trigger: none

name: 1.0$(Rev:.r)

pool: vmss-agentpool-linux-v2

stages:
- stage: SetValueStageName
  jobs:
  - deployment: SetValueDeployName
    environment: ${{ upper(parameters.env) }}
    strategy:
      runOnce:
        deploy:
          steps:
          - bash: |
              set -euo pipefail
              echo "MyDeployValue=>${MyDeployValue}<"
              echo '##vso[task.setvariable variable=MyDeploySetValue;isOutput=true]'${MyDeployValue}
              echo '##vso[task.setvariable variable=MyDeploySetValueNotOutput]'${MyDeployValue}
            env:
              MyDeployValue: ${{parameters.myDeployValue}}
            name: setValueDeployStepName
            displayName: Set Deploy Value

          - template: var_test_steps.yml
            parameters:
               myValue: ${{parameters.myDeployValue}}Template

          - bash: |
              echo "MyDeployStepEnvValue=>${MyDeployStepEnvValue}<"
              echo "MyDeployStepEnvValueNotOutput=>${MyDeployStepEnvValueNotOutput}<"
              echo "MyTemplateSetEnvValue=>${MyTemplateSetEnvValue}<"
            env:
              MyDeployStepEnvValue: $(setValueDeployStepName.MyDeploySetValue)
              MyDeployStepEnvValueNotOutput: $(MyDeploySetValueNotOutput)
              MyTemplateSetEnvValue: $(setValueTemplateStepName.MyTemplateSetValue)
            name: getDeployValueStep
            displayName: Get Deploy Value in another step

  - job: SetValueJobName
    steps:
    - bash: |
        set -euo pipefail
        echo "MyJobValue=>${MyJobValue}<"
        echo '##vso[task.setvariable variable=MyJobSetValue;isOutput=true]'${MyJobValue}
        echo '##vso[task.setvariable variable=MyJobSetValueNotOutput]'${MyJobValue}
      env:
        MyJobValue: ${{parameters.myJobValue}}
      name: setValueJobStepName
      displayName: Set Job Value

    - template: var_test_steps.yml
      parameters:
         myValue: ${{parameters.myJobValue}}Template

    - bash: |
        echo "MyJobStepEnvValue=>${MyJobStepEnvValue}<"
        echo "MyJobStepEnvValueNotOutput=>${MyJobStepEnvValueNotOutput}<"
        echo "MyTemplateSetEnvValue=>${MyTemplateSetEnvValue}<"
      env:
        MyJobStepEnvValue: $(setValueJobStepName.MyJobSetValue)
        MyJobStepEnvValueNotOutput: $(MyJobSetValueNotOutput)
        MyTemplateSetEnvValue: $(setValueTemplateStepName.MyTemplateSetValue)
      name: getJobValueStep
      displayName: Get Job Value in another step

  - deployment: getDeployValueDeploy
    dependsOn: SetValueDeployName
    variables:
    - name: MyDeploySetDeployDepValue
      value: $[ dependencies.SetValueDeployName.outputs['SetValueDeployName.setValueDeployStepName.MyDeploySetValue'] ]
    - name: MyDeploySetDeployDepNotOutputValue
      value: $[ dependencies.SetValueDeployName.outputs['SetValueDeployName.setValueDeployStepName.MyDeploySetValueNotOutput'] ]
    - name: MyTemplateSetValue
      value: $[ dependencies.SetValueDeployName.outputs['SetValueDeployName.setValueTemplateStepName.MyTemplateSetValue'] ]
    environment: ${{ upper(parameters.env) }}
    strategy:
      runOnce:
        deploy:
          steps:
          - bash: |
              echo "MyDeploySetDeployDepEnvValue=>${MyDeploySetDeployDepEnvValue}<"
              echo "MyDeploySetDeployDepNotOutputEnvValue=>${CICD_MyDeploySetDeployDepNotOutputEnvValue}<"
              echo "MyTemplateSetEnvValue=>${MyTemplateSetEnvValue}<"
            env:
              MyDeploySetDeployDepEnvValue: $(MyDeploySetDeployDepValue)
              MyDeploySetDeployDepNotOutputEnvValue: $(MyDeploySetDeployDepNotOutputValue)
              MyTemplateSetEnvValue: $(MyTemplateSetValue)
            displayName: Get Deploy Value in another deployment

  - job: getDeployValueJob
    dependsOn: SetValueDeployName
    variables:
    - name: MyDeploySetValueJobDepValue
      value: $[ dependencies.SetValueDeployName.outputs['SetValueDeployName.setValueDeployStepName.MyDeploySetValue'] ]
    - name: MyDeploySetValueJobDepNotOutputValue
      value: $[ dependencies.SetValueDeployName.outputs['SetValueDeployName.setValueDeployStepName.MyDeploySetValueNotOutput'] ]
    - name: MyTemplateSetValue
      value: $[ dependencies.SetValueDeployName.outputs['SetValueDeployName.setValueTemplateStepName.MyTemplateSetValue'] ]
    steps:
    - bash: |
        echo "MyDeploySetJobDepEnvValue=>${MyDeploySetJobDepEnvValue}<"
        echo "MyDeploySetJobDepNotOutputEnvValue=>${MyDeploySetJobDepNotOutputEnvValue}<"
        echo "MyTemplateSetEnvValue=>${MyTemplateSetEnvValue}<"
      env:
        MyDeploySetJobDepEnvValue: $(MyDeploySetValueJobDepValue)
        MyDeploySetJobDepNotOutputEnvValue: $(MyDeploySetValueJobDepNotOutputValue)
        MyTemplateSetEnvValue: $(MyTemplateSetValue)
      displayName: Get Deploy Value in another job

  - deployment: getJobValueDeploy
    dependsOn: SetValueJobName
    variables:
    - name: MyJobSetValueDeployDep
      value: $[ dependencies.SetValueJobName.outputs['setValueJobStepName.MyJobSetValue'] ]
    - name: MyJobSetValueDeployDepNotOutput
      value: $[ dependencies.SetValueJobName.outputs['setValueJobStepName.MyJobSetValueNotOutput'] ]
    - name: MyTemplateSetValue
      value: $[ dependencies.SetValueJobName.outputs['setValueTemplateStepName.MyTemplateSetValue'] ]
    environment: ${{ upper(parameters.env) }}
    strategy:
      runOnce:
        deploy:
          steps:
          - bash: |
              echo "MyJobSetDeployDepEnvValue=>${MyJobSetDeployDepEnvValue}<"
              echo "MyJobSetDeployDepNotOutputEnvValue=>${MyJobSetDeployDepNotOutputEnvValue}<"
              echo "MyTemplateSetEnvValue=>${MyTemplateSetEnvValue}<"
            env:
              MyJobSetDeployDepEnvValue: $(MyJobSetValueDeployDep)
              MyJobSetDeployDepNotOutputEnvValue: $(MyJobSetValueDeployDepNotOutput)
              MyTemplateSetEnvValue: $(MyTemplateSetValue)
            displayName: Get Job Value in another deployment
            
  - job: getJobValueJob
    dependsOn: SetValueJobName
    variables:
    - name: MyJobSetValueJobDep
      value: $[ dependencies.SetValueJobName.outputs['setValueJobStepName.MyJobSetValue'] ]
    - name: MyJobSetValueJobDepNotOutput
      value: $[ dependencies.SetValueJobName.outputs['setValueJobStepName.MyJobSetValueNotOutput'] ]
    - name: MyTemplateSetValue
      value: $[ dependencies.SetValueJobName.outputs['setValueTemplateStepName.MyTemplateSetValue'] ]
    steps:
    - bash: |
        echo "MyJobSetJobDepEnvValue=>${MyJobSetJobDepEnvValue}<"
        echo "MyJobSetJobDepNotOutputEnvValue=>${MyJobSetJobDepNotOutputEnvValue}<"
        echo "MyTemplateSetEnvValue=>${MyTemplateSetEnvValue}<"
      env:
        MyJobSetJobDepEnvValue: $(MyJobSetValueJobDep)
        MyJobSetJobDepNotOutputEnvValue: $(MyJobSetValueJobDepNotOutput)
        MyTemplateSetEnvValue: $(MyTemplateSetValue)
      displayName: Get Job Value in another job

- stage: GetValueStageName
  dependsOn:
  - SetValueStageName
  variables:
  - name: MyCrossStageDeploySetValueStageDep
    value: $[stageDependencies.SetValueStageName.SetValueDeployName.outputs['SetValueDeployName.setValueDeployStepName.MyDeploySetValue']]
  - name: MyCrossStageJobSetValueStageDep
    value: $[stageDependencies.SetValueStageName.SetValueJobName.outputs['setValueJobStepName.MyJobSetValue']]
  - name: MyCrossStageDeployTemplateSetValueStageDep
    value: $[stageDependencies.SetValueStageName.SetValueDeployName.outputs['SetValueDeployName.setValueTemplateStepName.MyTemplateSetValue'] ]
  jobs:
  - deployment: GetInDeployValueDeploy
    variables:
    - name: MyCrossStageDeploySetValueDeployDep
      value: $[stageDependencies.SetValueStageName.SetValueDeployName.outputs['SetValueDeployName.setValueDeployStepName.MyDeploySetValue']]
    - name: MyCrossStageJobSetValueDeployDep
      value: $[stageDependencies.SetValueStageName.SetValueJobName.outputs['setValueJobStepName.MyJobSetValue']]
    - name: MyCrossStageDeployTemplateSetValueDeployDep
      value: $[stageDependencies.SetValueStageName.SetValueDeployName.outputs['SetValueDeployName.setValueTemplateStepName.MyTemplateSetValue'] ]
    environment: ${{ upper(parameters.env) }}
    strategy:
      runOnce:
        deploy:
          steps:
          - bash: |
              echo "MyDeploySetStageDepEnvValue=>${MyDeploySetStageDepEnvValue}<"
              echo "MyJobSetStageDepEnvValue=>${MyJobSetStageDepEnvValue}<"
              echo "MyDeployTemplateSetStageDepEnvValue=>${MyDeployTemplateSetStageDepEnvValue}<"
              echo "MyDeploySetDeployDepEnvValue=>${MyDeploySetDeployDepEnvValue}<"
              echo "MyJobSetDeployDepEnvValue=>${MyJobSetDeployDepEnvValue}<"
              echo "MyDeployTemplateSetDeployDepEnvValue=>${MyDeployTemplateSetDeployDepEnvValue}<"
            env:
              MyDeploySetStageDepEnvValue: $(MyCrossStageDeploySetValueStageDep)
              MyJobSetStageDepEnvValue: $(MyCrossStageJobSetValueStageDep)
              MyDeployTemplateSetStageDepEnvValue: $(MyCrossStageDeployTemplateSetValueStageDep)
              MyDeploySetDeployDepEnvValue: $(MyCrossStageDeploySetValueDeployDep)
              MyJobSetDeployDepEnvValue: $(MyCrossStageJobSetValueDeployDep)
              MyDeployTemplateSetDeployDepEnvValue: $(MyCrossStageDeployTemplateSetValueDeployDep)

  - job: GetInJobValueJob
    variables:
    - name: MyCrossStageDeploySetValueJobDep
      value: $[stageDependencies.SetValueStageName.SetValueDeployName.outputs['SetValueDeployName.setValueDeployStepName.MyDeploySetValue']]
    - name: MyCrossStageJobSetValueJobDep
      value: $[stageDependencies.SetValueStageName.SetValueJobName.outputs['setValueJobStepName.MyJobSetValue']]
    - name: MyCrossStageDeployTemplateSetValueJobDep
      value: $[stageDependencies.SetValueStageName.SetValueDeployName.outputs['SetValueDeployName.setValueTemplateStepName.MyTemplateSetValue'] ]
    steps:
    - bash: |
        echo "MyDeploySetStageDepEnvValue=>${MyDeploySetStageDepEnvValue}<"
        echo "MyJobSetStageDepEnvValue=>${MyJobSetStageDepEnvValue}<"
        echo "MyDeployTemplateSetStageDepEnvValue=>${MyDeployTemplateSetStageDepEnvValue}<"
        echo "MyDeploySetJobDepEnvValue=>${MyDeploySetJobDepEnvValue}<"
        echo "MyJobSetJobDepEnvValue=>${MyJobSetJobDepEnvValue}<"
        echo "MyDeployTemplateSetJobDepEnvValue=>${MyDeployTemplateSetJobDepEnvValue}<"
      env:
        MyDeploySetStageDepEnvValue: $(MyCrossStageDeploySetValueStageDep)
        MyJobSetStageDepEnvValue: $(MyCrossStageJobSetValueStageDep)
        MyDeployTemplateSetStageDepEnvValue: $(MyCrossStageDeployTemplateSetValueStageDep)
        MyDeploySetJobDepEnvValue: $(MyCrossStageDeploySetValueJobDep)
        MyJobSetJobDepEnvValue: $(MyCrossStageJobSetValueJobDep)
        MyDeployTemplateSetJobDepEnvValue: $(MyCrossStageDeployTemplateSetValueJobDep)
```

The template it calls is:

```yaml
#--------------------------------------------
parameters:
- name: myValue
  type: string
#--------------------------------------------

steps:
- bash: |
    set -euo pipefail
    echo "MyEnvValue=>${MyEnvValue}<"
    echo '##vso[task.setvariable variable=MyTemplateSetValue;isOutput=true]'${MyEnvValue}
    echo '##vso[task.setvariable variable=MyTemplateSetValueNotOutput]'${MyEnvValue}
  env:
    MyEnvValue: ${{parameters.myValue}}
  name: setValueTemplateStepName
  displayName: Set Value in template
- bash: |
    set -euo pipefail
    echo "MyTemplateSetEnvValue=>${MyTemplateSetEnvValue}<"
    echo "MyTemplateSetNotOutputEnvValue=>${MyTemplateSetNotOutputEnvValue}<"
  env:
    MyTemplateSetEnvValue: $(setValueTemplateStepName.MyTemplateSetValue)
    MyTemplateSetNotOutputEnvValue: $(MyTemplateSetValueNotOutput)
  name: getValueTemplateStepName
  displayName: Get Value in another template step

```


## Update April 2023

See also [azure-devops-pipelines-var-access-part-2]({% post_url 2023-04-06-azure-devops-pipelines-var-access-part-2 %}) for how to access
Azure devops pipelines variables and parameters in a way that is reliable
both in a script and in template conditions.