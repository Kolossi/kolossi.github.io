---
title: Flex table test
categories: []
---

<div class="psouter">
    <div class="psrow psheader">
        <div class="pscell"><span>some header value</span></div>
        <div class="pscell"><span>a</span></div>
        <div class="pscell"><span>something</span></div>
        <div class="pscell"><span>b</span></div>
        <div class="pscell"><span>nahnahnahnahnahnahnahnhawowoheyheygoodbye</span></div>
    </div>
    <div class="psrow">
        <div class="pscell"><span>1</span></div>
        <div class="pscell"><span>a load of big long text</span></div>
        <div class="pscell"><span>3</span></div>
        <div class="pscell"><span>4</span></div>
        <div class="pscell"><span>5</span></div>
    </div>
    <div class="psrow">
        <div class="pscell"><span>6</span></div>
        <div class="pscell"><span>7</span></div>
        <div class="pscell"><span>im really going to go with a load of content here</span></div>
        <div class="pscell"><span>9</span></div>
        <div class="pscell"><span>10</span></div>
    </div>
</div>
<style>
    /* .psouter    {    } */
    /* .psrow {    
        flex-flow: column nowrap;
    } */
    .pscell
    {
        flex: 1;
        overflow: hidden;
    }
    .psheader
    {
        background-color: blue;
        color: white;
    }
    .psrow
    {
        display: flex;
        flex-direction: row;
    }
</style>