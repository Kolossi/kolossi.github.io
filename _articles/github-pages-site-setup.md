---
title:    Setting up a fully featured Github Pages site
modified: 2021-01-12T21-46-00+00.00
---
# Adding analytics, ads, and a Paypal donate button to a site created using Github pages

This post will explain how to use [Github pages](https://pages.github.com/) to create a very powerful but easy to use content site, and to add Google Analytics, Ads and a Paypal donate button to that site to monetise and monitor it.

## Setup a Github pages site

[Github pages](https://pages.github.com/) are websites created from Github repositories (aka "repos") using markdown files committed to the site.

There are 2 key types of [Github pages](https://pages.github.com/) site:
* what we'll refer to here as a "root" site
  * this will have a url like `https:\\{username}.github.io`
  * it is created from a repo also named `{username}.github.io`
* per-repository sites
  * these will have a url like `https:\\{username}.github.io\{repo-name}`
  * these can be created from any repo

If needed, [create a (free) Github user](https://github.com/join).

Create a repository for the site - make one for the root site called `{username}.github.io` if not already done.

To enable the Github pages site to be created from the repository,
* go to the repository in github, the url will be like `https://github.com/{username}/{repo-name}`
→ Settings (`https://github.com/{username}/{repo-name}/settings`)
→ scroll right down to the "Github pages" section
→ under "Source", where it shows `None v` select the branch to use for the site and click "save"
→ Click `Choose a theme` and pick one

Now any files named `*.md` committed and pushed to the repo will be (after a delay of up to a couple of minutes) rendered and available on the web.
* `index.md` will be available as `https:\\{username}.github.io\{repo-name}` or just `https:\\{username}.github.io` for the root site
* any other `{filename}.md` will be available as `https:\\{username}.github.io\{repo-name}\{filename}.html` or `https:\\{username}.github.io\{filename}.html`.  Notice that the `*.md` filename turned into `*.html` for browsing.

The `*.md` [Markdown](https://github.github.com/gfm/) files are rendered into html automatically by Github each time changes are pushed, using the [Jekyll](https://jekyllrb.com/) engine

Read [About GitHub Pages and Jekyll](https://docs.github.com/en/github-ae@latest/github/working-with-github-pages/about-github-pages-and-jekyll) for more details.

Once you have any kind of test content being published to your Github pages url, move on.

## Collections

Jekyll [Collections](https://jekyllrb.com/docs/collections/) are ways to group together similar types of content and/or sharing the same layout. This saves piling all the content pages into the repo root.  There's [quick guide](https://jekyllrb.com/docs/step-by-step/09-collections/) on the Jekyll site.

There are two special types of collections - "Posts" and "Pages".  [This](https://ben.balter.com/2015/02/20/jekyll-collections/) page and [this](https://stackoverflow.com/questions/15095625/what-are-the-differences-between-a-post-and-a-page-in-jekyll) one explain the differences quite well.  We will stick with general "collections" for now.

To support content being in e.g. an "articles" collection:

* Add a directory `_articles` to the root of the repo
* create a file `_articles\index.md`
* [Jekyll/Liquid templating](https://jekyllrb.com/docs/liquid/) can be used to give a table of contents of all articles in the index page by giving it in the content:

```markdown
# My Articles

{% raw %}
{% for article in site.articles %}
* [{{article.title}}]({{article.url}})
{% endfor %}
{% endraw %}
```

* (such code can also be included in the main site `index.md` to add "articles" content there)
* create `*.md` content files in this directory. The `{% raw %}{{article.url}}{% endraw %}` item is one supported automatically, but the "title" is not.  To add this data to a content page, we add it in a yaml "front matter" block in the page, e.g. `_articles\front-matter.md`:

```markdown
---
title: A page about front matter
modified: 2021-01-12T18:17:00+00.00
---

# A page about front matter

These are some details about yaml front matter.
```

* The lookup code can be used within the page itself, for instance to reuse the front matter title as the initial heading:

```markdown
---
title: A page about front matter
modified: 2021-01-12T18:17:00+00.00
---

# {% raw %}{{ page.title }}{% endraw %}

These are some details about yaml front matter.
```

* The `*.md` files will be processed and available to the loop codes, but the pages themselves won't be added as content.  To arrange this, add the following to the root file `_config.yml`:

```yaml
collections:
  articles:
    output: true
```

* The files will now be created, but will be without layout (and theme/style).
  * To use the default layout for this collection, add the following to `_config.yml`

```yaml
defaults:
  - scope:
      path: ""
      type: "articles"
    values:
      layout: "default"
  - scope:
      path: ""
    values:
      layout: "default"
```

  * To use a different layout, add a relevant file to the `_layouts` directory and refer to it in the `_config.yml` layout item, e.g. add `_layouts\my-article-layout.html` then use the following in `_config.yml`:

```yaml
defaults:
  - scope:
      path: ""
      type: "articles"
    values:
      layout: "my-article-layout"
...
```

## Add Google Advertising to the site

### First will Google AdSense or Google Ads be used?

It took me a while to clarify this in my mind, but [TL;DR](https://www.urbandictionary.com/define.php?term=tl%3Bdr "Too Long; Didn't Read (so here's a brief summary):") :
* Google Ads is where manufacturers/vendors pay google to display their site in search result when their chosen keywords are used in a search
* Google AdSense is where content creators put adverts on their site to get revenue from clicks

So Google AdSense is what will be used.

### Add Google AdSense to the site

[Sign up for Google AdSense](https://www.google.com/adsense/signup) using a new or existing google account.

If there are multiple github pages sites under the github account, it's the root one `https://{username}.github.io` that must be specified during signup.  The Google Ads signup says subdomains aren't allowed as the url to be signed up for, but it seems fine with an account github.io subdomain.  It does reject individual repo github pages sites like `https://{username}.github.io/MyRepo` though.

Once signed up though, individual repo sites can have ads added, it's just that the signup/verification has to be the root site.

Once this is given, there will be a request at some point to add some html to the `HEAD` section of each page of the (Github pages user) root site html.

### Adding HEAD code to the site

When simply using the default themes for Github pages, this isn't editable, but a very small change allows it (and the analytics changes required shortly).

First, find the layout page of the site's chosen theme. If using a custom theme this will just need a bit of googling.

For default themes, it will likely just be of the form `https://github.com/pages-themes/{theme name}/blob/master/_layouts/default.html`

e.g. for the slate theme : `https://github.com/pages-themes/slate/blob/master/_layouts/default.html`

Download the source of this file (click the `Raw` button top-right above the content), and save in the site repo as `./_layouts/default.html`.

In the head section of this file (my suggestion, immediately before the closing `<\head>`), add the code requested by Google AdSense signup, it should look like this (but with a unique client id):

```html
    <script data-ad-client="ca-pub-1234567890123456" async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
```

Save the file, add and commit to git and push to the github repo.

Once the site has been republished, take a look at the page source to check that the code is there in the `<HEAD>` code.

### Complete Google AdSense signup

Once the site has been republished with the necessary `<HEAD>` code in place, confirm to Google AdSense signon thatit's there.

The Google AdSense page should confirm that the content was found and say Google will go off and have a good think about your application for a few **days or even weeks**...

In the meantime, move on to setting up Google Analytics

## Add Google Analytics to the site

[Sign up with Google Analytics](https://analytics.google.com/) using a new or existing google account - there's some logic in using the same account for AdSense and Analytics.

Google Analytics has changed recently from using "Universal Analytics" (aka UA) to Google Analytics 4 (aka GA4).

We'll use GA4 here, but need to be aware of old UA references and code which may appear in the existing themes.

Unless default options are changed, only <abbr title="Google Analytics 4">GA4</abbr> will be set up and not <abbr title="Universal Analytics">UA</abbr>.  For new sites this is probably the best option.

### Create an Analytics account and Property

Analytics accounts can have many properties under them.

* Go to the [Google Analytics homepage](https://analytics.google.com/)
* click `Admin` (with the cog icon) at the bottom of the left toolbar.
* If no account has yet been created:
→ click `+ Create Account`
→ Give the account a name (perhaps include the Github username)
→ choose data sharing options (I only selected "Technical Support")
→ click `Next`
* If an account does already exists:
→  select it in the dropdown at the top of the left hand column
→ click `+ Create Property`
* Give the new property a name (the website name seems a good approach)
* Set the regional attributes
* click `Next`
* Set the industry category, size and usage types
* click `Create`

### Find setup info

The 
* Go to the [Google Analytics homepage](https://analytics.google.com/)
* click `Admin` (with the cog icon) at the bottom of the left toolbar.
* select the correct account in the dropdown at the top of the left column
* select the correct property in the dropdown at the top of the next (middle) column
* click `Setup Assistant` at the top of the property column
* under the "Collection" section, click the `>` at the right of the "Tag installation" line
* click the `>` at the right of the "data stream" line

The Measurment ID is shown top-right with a copy-to-clipboard icon to the right of it.  It will be of the form "G-xxxxxxxxxx".

Make a not of this, but to get the full code we need:

* in the second section "Tagging instructions"
→ make sure the "Add new on-page tag" tab is selected
→ click the `v` downarrow on the left of the "Global Site Tag (gtag.js)" line

### Copy AdSense setup info

Copy the `<head>` tag code shown, it should be very simlar to this (unless the code has been updated since this was written):

```html
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-xxxxxxxxxx"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-xxxxxxxxxx');
</script>
```

### Adding Analytics HEAD code to the site

See the [AdSense section](#adding-head-code-to-the-site) about how to add the `<HEAD>` code to the site, but using the [AdSense code](#copy-adsense-setup-info) found above.

### Test Analytics

The site should now be doing analytics tracking.  Visit the site - but make sure to use an incognito browser tab if ad/tracking block plugins are installed !!!!

Click some links and scroll the page around too.

To see that data:

* visit the [Google Analytics homepage](https://analytics.google.com/)
* click `Realtime` in the left hand sidebar
* make sure the correct account and property are selected at the very top of the page, to the right of the "Analytics" logo and text.
* your recent visit should be showing up in the stats and and map!

## Add a cookie privacy managment page

This is crucial for GDRP / DPA but I'll come back to this another day!

## Add a paypal donate button

This was way easier than I though it would be!

Follow this link to [Create a paypal donate button](https://www.paypal.com/donate/buttons).

Once created, if the html to include wasn't shown, go to
* [Settings](https://www.paypal.com/myaccount/settings)
→ [Seller tools](https://www.paypal.com/myaccount/profile/seller-tools)
→ [Paypal buttons / Manage](https://www.paypal.com/buttons/)
→ [View your saved buttons](https://www.paypal.com/cgi-bin/webscr?cmd=_button-management) (top right)
→ On the line for the correct button: Action → View code

The code will look something like this but with a unique `hosted_button_id`:

```html
<form action="https://www.paypal.com/donate" method="post" target="_top">
<input type="hidden" name="hosted_button_id" value="ABCDE12345XYZ" />
<input type="image" src="https://www.paypalobjects.com/en_GB/i/btn/btn_donate_SM.gif" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
<img alt="" border="0" src="https://www.paypal.com/en_GB/i/scr/pixel.gif" width="1" height="1" />
</form>
```

Just add this html straight in the page markdown, but on its own set of lines (not inline with text).

## Site workflow

To make things easier, add a [git auto push webhook](\quicktips\git-auto-push-win-nix.html).