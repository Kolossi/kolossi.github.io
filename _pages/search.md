---
layout: page
title: Search
permalink: /search/
no_share_links: true
---

<div id="search-container">
    <input type="text" id="search-input" placeholder="Starting typing to quick search..." autofocus>
    <ul id="search-results-container"></ul>
</div>

<script src="{{ site.baseurl }}/assets/simple-jekyll-search.min.js" type="text/javascript"></script>

<script>
    SimpleJekyllSearch({
    searchInput: document.getElementById('search-input'),
    resultsContainer: document.getElementById('search-results-container'),
    searchResultTemplate: '<div class="search-item"><a href="{url}"><h2 class="search-item search-title">{title}</h1></a><div class="search-item search-date">{date}</div></div>',
    json: '{{ site.baseurl }}/search.json'
    // ,fuzzy: true,
    });
</script>