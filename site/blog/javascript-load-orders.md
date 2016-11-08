## Javascript Load Orders

As per <https://api.drupal.org/api/drupal/includes%21common.inc/function/drupal_add_js/7.x> - **The exact ordering of JavaScript is as follows**

#####Load Order

* First by scope, with 'header' first, 'footer' last, and any other scopes provided by a custom theme coming in between, as determined by the theme.
* Then by group.
* Then by the 'every_page' flag, with TRUE coming before FALSE.
* Then by weight.
* Then by the order in which the JavaScript was added. For example, all else being the same, JavaScript added by a call to drupal_add_js() that happened later in the page request gets added to the page after one for which drupal\_add\_js() happened earlier in the page request.

**The load order of Javascript is the same unaggregated and aggregated.**

#####Execution Order

Within the load order:

* Javascript that is inside an IIFE will execute first
* Javascript inside Drupal.behaviours will execute next
* Javascript inside $(document).ready() will execute last

#####Simulated Load & Execution Order

* libraries added using drupal\_add\_library() from within a module
* autodesk\_jstest.module - array('group' => -100, 'scope' => 'header', 'every\_page' => TRUE, 'type' => 'file', ) - IFFE
* autodesk\_jstest.info - IFFE
* autodesk\_jstest.module - array('group' => 0, 'scope' => 'header', 'every\_page' => TRUE, 'type' => 'file', ) - IFFE
* template.php - IFFE
* autodesk\_foundation5.info - IFFE
* autodesk\_jstest.module - array('group' => -100, 'scope' => 'footer', 'every\_page' => TRUE, 'type' => 'file', ) - IFFE
* autodesk\_jstest.module - array('group' => 0, 'scope' => 'footer', 'every\_page' => TRUE, 'type' => 'file', ) - IFFE
* autodesk\_jstest.module - array('group' => -100, 'scope' => 'header', 'every\_page' => TRUE, 'type' => 'file', )  - Drupal.Behaviour
* autodesk\_jstest.info - Drupal.Behaviour
* autodesk\_jstest.module - array('group' => 0, 'scope' => 'header', 'every\_page' => TRUE, 'type' => 'file', )  - Drupal.Behaviour
* template.php - Drupal.Behaviour
* autodesk\_foundation5.info - Drupal.Behaviour
* autodesk\_jstest.module - array('group' => -100, 'scope' => 'footer', 'every\_page' => TRUE, 'type' => 'file', )  - Drupal.Behaviour
* autodesk\_jstest.module - array('group' => 0, 'scope' => 'footer', 'every\_page' => TRUE, 'type' => 'file', )  - Drupal.Behaviour
* autodesk\_jstest.module - array('group' => -100, 'scope' => 'header', 'every\_page' => TRUE, 'type' => 'file', ) - $(document).ready()
* autodesk\_jstest.info - $(document).ready()
* autodesk\_jstest.module - array('group' => 0, 'scope' => 'header', 'every\_page' => TRUE, 'type' => 'file', ) - $(document).ready()
* template.php - $(document).ready()
* autodesk\_foundation5.info - $(document).ready()
* autodesk\_jstest.module - array('group' => -100, 'scope' => 'footer', 'every\_page' => TRUE, 'type' => 'file', ) - $(document).ready()
* autodesk\_jstest.module - array('group' => 0, 'scope' => 'footer', 'every\_page' => TRUE, 'type' => 'file', ) - $(document).ready()


#####.info and template.php

* Javascript loaded via Module .info files is added to ('scope' => 'header',  'group' => 0, 'every\_page' => TRUE)
* Javascript loaded via the Theme .info file is added to ('scope' => 'header', 'group' => 100, 'every\_page' => TRUE)
* Javascript loaded inside the template.php hook\_preprocess\_html() is added to ('scope' => 'header', 'group' => 0, 'every\_page' => FALSE') - **but it is added on EVERY PAGE** - You should explicity set 'every_page' => TRUE or load the javascript in a different file

##### hook_init()
* Javascript loaded inside of a Modules hook\_init() is added to ('scope' => 'header', 'group' => 0, 'every\_page' => FALSE) - **but it is added on EVERY PAGE** - You should explicity set 'every_page' => TRUE or load the javascript file in another function.

## Javascript Aggregation
<https://www.lullabot.com/articles/javascript-aggregation-in-drupal-7>

Let’s take a close look at the parameters affecting Javascript aggregation. **Drupal will create an aggregate for each unique combination of the scope, group, and every\_page parameters**, so it’s important to understand what each of these mean.

It is possible to see how files are aggregated with the following code. Note dsm() requires devel.

```php
// include/common.inc
// drupal_get_js()'
// add the code at line 4478
	if ($item['every_page']) {$every_page = "every-page";} else {$every_page = "not-every-page";}
	$key = 'aggregate_' . $item['group'] . '_' . $item['scope'] . '_' . $every_page . '_' . $index;      
// add the code below to line 4512
	dsm($key);
	dsm($uri);
	dsm($files[$key]);
```  

####Aggregation Grouping
**Drupal will create an aggregate for each unique combination of the scope, group, and every_page parameters**

* group: -100, every\_page: true, scope: header, preprocess: true
* group: -100, every\_page: false, scope: header, preprocess: true
* group: 0, every\_page: true, scope: header, preprocess: true
* group: 0, every\_page: false, scope: header, preprocess: true
* group: 100, every\_page: true, scope: header, preprocess: true
* group: 0, every\_page: false, scope: footer, preprocess: true


## Drupal.settings Is Undefined
The Drupal.settings object is only available to Javascript wrapped in $(document).ready() or inside a Drupal behaviour. 

If you wish to access Drupal.settings inside an anonymous function or IFFE, you can include the Drupal object earlier in the bootstrap by using

```javascript
(function(jQuery, Drupal) {
	log.debug(Drupal.settings);
})(jQuery, Drupal);
```

## Tips To Achieve Optimal Javascript
####Load Javascript files in a way that allows them to be aggregated by Drupal aggregation
* Files added using drupal\_add\_js('/js/filename.js', array('type' => 'external') will not be aggregated
* Files added inline in template files using \<script\> will not be aggregated
* If drupal\_add\_js('preprocess' => false) is set, the file will not be aggregated

A good way to identify non-aggregated files is to turn on Drupal aggregation and load a page in Chrome. Goto the "sources" panel 

![Chrome Dev Tools Sources Panel](sources.png)

####Optimize Aggregation

Try to load the javascript file into the optimal aggregated file based on your load order needs and if the file needs to be used on every page (or almost every page) or if it is only needed on a few pages.

####Where possible, only load Javascript files when the module is "active"
* Calling drupal\_add\_js() inside of hook_init() will load the file on every page, even if the module is "inactive". It will be added to "_group: 0, every\_page: false, scope: header, preprocess: true_"
* Javascript files included in the modules .info file will load on every page, even if the module is "inactive"

####Try not to include different versions (or filenames) of the same file, across modules
####Remove Javascript files which are no longer used
####Javascript which is not related to a module or is largely generic, consider moving into scripts.js as a Drupal.behavior


## Double Loading
* Prevent double execution of Drupal.behaviours. Modify the function call to Drupal.attachBehaviours in the “was this helpful" module.

```php
// modules/custom/autodesk_search_feedback/templates/autodesk_search_feedback.tpl.php
	- Drupal.attachBehaviors('#search-helpful-id', Drupal.settings);
	+ Drupal.behaviors.analytics.attach();
```

```php
// modules/custom/autodesk_helpful/template/autodesk_helpful.tpl.php 
	- Drupal.attachBehaviors('#helpful-article', Drupal.settings);
	+ Drupal.behaviors.analytics.attach();
```

* In scripts.js - add the .once() method to code that manipulates the DOM on CAAS pages.

```php
// js/app/scripts.js
 + $('.caas_dt_body_text').once().prepend("<h2>Description</h2>");
```

## Clean Up Themes /js/ Folder
* Modify the /js/ as per the following table
* Added log.info() to all behaviors and js in custom modules, this helps to visualize load order.
* *loglevel.js*, *js-cookie.js* and *foundation.min.js* should be loaded first. This fixes intermittent undefined function errors from .log() and .foundation()

```php
 // template.php
 // function autodesk_preprocess_html() {
 	drupal_add_js(
 		"sites/all/modules/custom/autodesk_faceted_search/js autodesk_faceted_search.validate.js",
    	array('type' => 'file', 'scope' => 'header', 'group' => 'JS_LIBRARY'));
```
**Some Javascript in the /js/ folder could be moved into modules**

* Move js/akn_mlt/akn_mlt.js into modules/custom/adsk_related_links/ module. This module must be renamed to autodesk_related_links to evade adblocking
* Turn akn_header_search.app.js into a Drupal module and a block

## Remove Javascript From zurb_foundation
* ;scripts[] = js/vendor/modernizr.js
* ;scripts[] = js/foundation.js

## jQuery Update
Attempt to use only 1 version of jQuery.

* Change jquery-update module jQuery version from 1.7 -> 1.9
* Change jquery-update module jQuery admin version to 1.7. jquery-update allows a separate version of jQuery to be set for the admin theme. the admin “seven” theme requires 1.7 or less.
* Update depreciated methods for 2 functions so they are compatible with jQuery 1.9

------

* Disable jqmulti module - this module is required by:
	* (Adblock Fix) Autodesk Pluck Integration 
	* Autodesk Topic Article Feature, 
	* ADSK Products (Taxonomy), 
	* ADSK Download Content Type, 
	* Autodesk Taxonomy Sync, 
	* CAAS Context Feature, 
	* Autodesk Simple Content Type, 
	* Autodesk Collections Content Type, 
	* Autodesk GPS Widget
* Remove jqmulti dependancies from features and module .info files
* Find and replace references to jq190 -> jQuery

------

* index_refresh.php loads jquery and jscookie directly - Could we load these files from CDN? 
	* sites/all/libraries/jquery/jquery-1.9.0.min.js
	* sites/all/themes/autodesk_foundation5/js/vendor/js-cookie.min.js


## Drupal Libraries

There are couple of ways to define a library in Drupal. 

2. The Drupal Core Library system (used for managing and loading shared libraries of JS & CSS) which is accessed by hook\_library() and drupal\_get\_library()
3. The [Libraries contrib module](http://www.drupalcontrib.org/api/drupal/contributions%21libraries%21libraries.module/7) accessed by hook\_libraries\_info() &  libraries\_load()


#### Print active Drupal Core Libraries to the page (inside the messages block)
```php
// template.php
// preprocess_html() 
// display available libraries
	$module_libraries =  module_list();
	$test = [];
	foreach ($module_libraries as $key => $data) {
		$test += (drupal_get_library($data));
	}
	dsm($test);
```


#### Use a contrib module library wrapper for the library
	
For example: [Drupal Backbone](https://www.drupal.org/project/backbone) - _Unfortunately library wrappers often contain outdated versions of the Javascript library, or include bloated and unnecessary additional features_
	
#### Create your own Drupal library wrapper using hook\_library()

```php
// autodesk_loglevel.module

/**
 * Implements hook_library().
 */
function autodesk_loglevel_library() {
  // Library One.
  $libraries['loglevel'] = array(
    'title' => 'Log Level',
    'website' => 'http://example.com/library-1',
    'version' => '1.2',
    'js' => array(
      drupal_get_path('theme', 'autodesk_foundation5') . '/js/vendor/loglevel.js' => array(),
    )
  );
  return $libraries;
}
```
```php
// Loading the library from another module for example - autodesk_translation.module
	drupal_add_library('autodesk_loglevel','loglevel');
```

##### Create a library using the libraries contrib module
<http://atendesigngroup.com/blog/adding-js-libraries-drupal-project-libraries-api>


## Line by Line

* autodesk_contributions.modules loads //code.jquery.com/ui/1.11.4/jquery-ui.min.js' - jQuery UI 1.10.2 is included with jquery_update.

```php
 	//  drupal_add_js ( '//code.jquery.com/ui/1.10.2/jquery-ui.min.js', array (
	//      'type' => 'external',
	//      'scope' => 'footer'
	//  ) );
  	drupal_add_library('system','ui.mouse');
  	drupal_add_library('system','ui.sortable');
```
* adsk_caas/adsk_caas.js should be moved to scripts.js as a Drupal.behavior
* adsk_lithium
	* drupal_add_js(drupal_get_path('module', 'adsk_lithium') . '/js/underscore.js');
	* Looks like the underscore library is being used in lithium_contactus_block_theme.tpl.php line 159
* autodesk_translation.module
	* this module is loading javascript files using 'type' => 'external' so they are not being aggregated in production


