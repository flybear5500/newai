# Activ'HA widget for external websites

This repository contains a script (`downloadWiget.js` and its minified version `downloadWiget.min.js`) that will download another script `widget.js`. This will create a widget on ActivHA partners' websites, connecting to their partnership page on activ-ha.com.

## Process

1. Once logged in on activ-ha.com, a partner can generate a link for a script. This link has to be integrated to its own website. The `index.html` file in this repository is here to demonstrate the ability of integrating this link on a partner's website.

2. When the partner's website is loaded, the script from ActivHA is loaded too, and a button is displayed on the partner's website.

3. If a user clicks this button, an iframe is loaded, displaying the partner's page content on activ-ha.com. The right partner page is loaded thanks to the `path` setting coming from the JS script.

## Development

Run `npm install` to install the project. The main file is `js/widget.js`, but it will be loaded through `js/downloadWidget.js` (minified to be used in production).

While developing, run `npm run watch` to minify `js/downloadWidget.js` after every save. When ready, run `npm run minify` to generate the minified and production-ready version.

On every commit, `Prettier` is run on JS files to format them correctly.
