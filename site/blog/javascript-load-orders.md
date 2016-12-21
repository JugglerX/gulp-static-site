## Javascript Load Orders

As per <https://api.drupal.org/api/drupal/includes%21common.inc/function/drupal_add_js/7.x> - **The exact ordering of JavaScript is as follows**

#####Load Order

* First by scope, with 'header' first, 'footer' last, and any other scopes provided by a custom theme coming in between, as determined by the theme.
* Then by group.
* Then by the 'every_page' flag, with TRUE coming before FALSE.
* Then by weight.
* Then by the order in which the JavaScript was added. For example, all else being the same, JavaScript added by a call to drupal_add_js() that happened later in the page request gets added to the page after one for which drupal\_add\_js() happened earlier in the page request.

**The load order of Javascript is the same unaggregated and aggregated.**
