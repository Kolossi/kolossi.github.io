---
title: Using Paint.Net Alpha Paste plugin to create a shadow
date: 2021-01-17T18-56-02+00.00
---

# {{ page.title }}

## Alpha Paste plugin install

To add the Alpha Paste plugin to the free windows image manipulation program [Paint.Net](https://www.getpaint.net/):

* download [BoltBait's plugin pack](https://forums.getpaint.net/topic/113220-boltbaits-plugin-pack-for-pdn-v4212-and-beyond-updated-july-16-2020/).
* unzip the file and run the `.exe` inside
* exit any running Paint.Net
* agree to the T's & C's then click `Install everything!` (or choose less if desried)

## Using the Alpha Paste plugin

I want to change the following [shadow image](https://i.emlfiles4.com/cmpimg/0/0/1/1/8/files/10615314_shadows2.png) I saw in an email ...

----

![Grey shadow](/assets/grey-shadow-down.png)

----

... into a blue-ish version for use in my website.

I've got this in just a few simple steps:
* load the shadow up in Paint.Net
* add a new layer
* fill the new layer with the solid blue colour (use rectangle tool)
* select the existing shadow layer image, and copy the whole image (`ctrl-a` `ctrl-c`).
* select the blue layer and choose `Effects` -> `Object` -> `Paste Alpha...`
* make sure `Replace current alpha with...` and `Shades of grey on clipboard...` are selected and `Invert calculation` is checked
* click `OK`
* select the orginal shadow layer, and fill it with white
* save the image as a png (accept the warning that the layers will be "flattened").
* flip vertically and save again.

The up and down image versions can now be used :

![up shadow](/assets/blue-shadow-up.png)

This is the message which I want to draw attention to, but not too much!

![down shadow](/assets/blue-shadow-down.png)

That was easy, and looks pretty sweet I think.