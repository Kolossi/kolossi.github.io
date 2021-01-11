# Adding analytics, donate button and ads to a Github pages site

This post will explain how to use [Github pages](https://pages.github.com/) to create a very powerful but easy to use content site, and to add Google Analytics, Ads and a Paypal donate button to that site to monetise and monitor it.



### First: Google AdSense or Google Ads?

It took me a while to clarify this, but [TL;DR](https://www.urbandictionary.com/define.php?term=tl%3Bdr "Too Long; Didn't Read (so here's a brief summary):") :
* Google Ads is where manufacturers/vendors pay google to display their site in search result when their chosen keywords are used in search
* Google AdSense is where content creators put adds on their site to get revenue from clicks

So Google AdSense is what will be used.

## Add Google AdSense to the site

[Sign up for Google AdSense](https://www.google.com/adsense/signup) using a new or existing google account.

If there are multiple github pages sites under the github account, it's the root one `https://{username}.github.io` that must be specified during signup.  The Google Ads signup says subdomains aren't allowed as the url to be signed up for, but it seems fine with an account github.io subdomain.  It does reject individual repo github pages sites like `https://{username}.github.io/MyRepo` though.

Once signed up though, individual repo sites can have ads added, it's just that the signup/verification has to be the root site.

Once this is given, there will be a request at some point to add some html to the `HEAD` section of each page of the (Github pages user) root site html.

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

Once the site has been republished, take a look at the page source to check it's there, then confirm to Google AdSense signon that's it there.

The Google AdSense page should confirm that the content was found and say Google will go off and have a good think about your application for a few days or even weeks...

In the meantime, move on to setting up Google Analytics

## Add Google Analytics to the site

[Sign up with Google Analytics](https://analytics.google.com/) using a new or existing google account - there's some logic in using the same account for AdSense and Analytics.

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