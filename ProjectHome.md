# Multi-Language Translation Script #

## News ##

  * **22nd January 2010**: Version 0.2.5 of script released! This update fixes a bug that could cause script errors and crashes on certain sites - please see the [Important Information](http://code.google.com/p/multi-language-translation/wiki/Documentation#Alterations_for_Script_Version_0.2.5) about upgrading to this version...
  * **18th January 2010**: Version 0.2.4 of script released! By default, new site visitors will now be asked if they want to switch to their native language (auto-detected based on their browser / system settings). Alternatively, the webmaster can now specify an initial default language or just display the untranslated site; among other improvements... Please see the [Important Information](http://code.google.com/p/multi-language-translation/wiki/Documentation#Alterations_for_Script_Version_0.2.4) about upgrading to this version...
  * **1st December 2009**: The initial version of the [documentation](http://code.google.com/p/multi-language-translation/wiki/Documentation) is now entirely complete! All feedback would be very welcome...

[More Project News...](http://code.google.com/p/multi-language-translation/wiki/News)

## About This Script ##

This script will automatically translate any web page or site that contains text written in more than one language, into a single language requested by the user. This can be particularly useful for sites involving a lot of user-generated content - such as blogs, forums, and other community websites. On such sites, users from many different countries may have registered, and would like to post content in their own native language. Whilst supporting this would encourage participation, it does present challenges to users who do not speak that language.

Due to the amount of content produced by users on these sites, few organisations have the resources to manually translate everything into languages that all users can understand; so usually the best option is to offer some kind of automated translation. Automatic translators such as [Google Translate](http://translate.google.com), whilst imperfect, have improved dramatically over the past few years; and virtually always allow a non-native speaker to gain at least some understanding of the meaning of the original text.

Whilst users may choose to use such tools by themselves, this is not particularly user-friendly, or helpful to those who do not know about them. It is better to embed automatic translation functionality directly into the sites which require this. Providers such as [Google](http://www.google.com) offer a number of [Translation Tools](http://translate.google.com/translate_tools) to achieve this easily. These tools work well if a site contains text posted in a single known language, but often not so well for sites with pages containing text written in multiple languages (which would usually be the case if content is produced by active users from a range of countries).

This script aims to overcome this limitation, as it is specifically designed to translate content from multiple source languages into any destination language desired; harnessing the [Google AJAX Language API](http://code.google.com/intl/en/apis/ajaxlanguage/) to perform translation and language detection.

## Script Features ##

  * Can be deployed with ease on [virtually any modern website](http://code.google.com/p/multi-language-translation/wiki/Documentation#What_Things_Do_I_Need_to_Use_and/or_Deploy_This_Script?) (regardless of underlying platform).
  * Ability to translate content written in [more than 50 languages](http://code.google.com/intl/en/apis/ajaxlanguage/documentation/#SupportedPairs) into any single one of these languages (as well as to view the original untranslated content), whenever requested by the user.
  * Remembers the selected language whenever the user visits any page throughout the site (or re-visits it on future occasions) - automatically translating content into this language. New users can be presented with the option to switch to their main language (auto-detected based on browser / system settings), or alternatively webmasters can specify a desired default language of their choice.
  * [Uses AJAX to perform translations dynamically](http://code.google.com/p/multi-language-translation/wiki/Documentation#What_are_the_Benefits/Trade-offs_of_Using_JavaScript_to_Perform) on screen as the user watches - no page reloads required. Optimised to run smoothly and quickly.
  * Regions on the page automatically display the new content as it is translated, so users have something to read whilst waiting for translation to complete.
  * Displays the amount of progress whilst a translation is running.
  * Effective handling of any translation errors and time-outs, should they occur. If an error occurs (e.g. rare cases where the source language of a section cannot be detected), the user can view full details of the problem, and the affected sections are indicated.
  * Automatically converts translation status messages etc into the requested destination language, to cater for users who do not speak English.
  * Ability to optionally show a line of text below any region of content displaying the original source language of that region. Users can now also click on a link to show/hide the original source text for that region.
  * Full control over the precise regions on each page to translate - this ensures [flexibility and high translation quality](http://code.google.com/p/multi-language-translation/wiki/Documentation#Why_Do_I_Need_to_Specify_the_Regions_to_Translate_on_Each_Page?).

## What to Do Now? ##
  1. [Download](http://code.google.com/p/multi-language-translation/downloads/list) the latest version of this script.
  1. Visit the [Wiki](http://code.google.com/p/multi-language-translation/w/list) for full [documentation](http://code.google.com/p/multi-language-translation/wiki/Documentation) explaining how to deploy the script on your site, as well as for [examples](http://code.google.com/p/multi-language-translation/wiki/Documentation#Further_Examples) and additional information.
  1. Go to the [Issue Tracker](http://code.google.com/p/multi-language-translation/issues/list) and report any bugs or problems experienced, as well to as offer any suggestions for enhancements and new functionality, and to ask questions or provide comments on the script. All feedback is gratefully appreciated!
  1. View the [Source](http://code.google.com/p/multi-language-translation/source/browse/) to see the latest development work on the script.
  1. [Get involved](http://code.google.com/p/multi-language-translation/wiki/Documentation#How_Can_I_Contribute_Towards_This_Project?) by contributing your ideas and expertise - and thereby directly support the future evolution of this project!

## Disclaimer ##
The script as a whole is released as Open Source under the [MIT License](http://www.opensource.org/licenses/mit-license.php). Please note however that portions directly interact with (_Invoke_) functionality of the [Google AJAX Language API](http://code.google.com/intl/en/apis/ajaxlanguage/), which is governed by the [AJAX API Terms of Use](http://code.google.com/intl/en/apis/ajaxlanguage/terms.html). **It is therefore your responsibility to ensure that your usage of this script on your website fully complies with those terms**. The developer of this script is in no way affiliated with Google. [More Information](http://code.google.com/p/multi-language-translation/wiki/Documentation#Script_Licence)