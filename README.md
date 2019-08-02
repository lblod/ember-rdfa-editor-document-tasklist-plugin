@lblod/ember-rdfa-editor-document-tasklist-plugin
==============================================================================

Plugin for extracting information about a tasklist linked to a document and publishing it.


Compatibility
------------------------------------------------------------------------------

* Ember.js v3.4 or above
* Ember CLI v2.13 or above
* Node.js v8 or above


Installation
------------------------------------------------------------------------------

```
ember install ember-rdfa-editor-document-tasklist-plugin
```


Usage
------------------------------------------------------------------------------
This plugin will scan RDFA content of the document and check whether there is
info availible about a tasklist linked with the document.
It just keeps track WHETHER there is a task-list associated the template.
Not the eventual completion of the tasklist.

To tell the plugin to publish the data, insert the following in your plugin.
```
<div class="ext_tasklist_data" typeof="ext:TasklistData" resource="http://task/list/data">
  <div property="ext:idInSnippet" content="a-uuid">a-uuid</div>
  <meta property="ext:tasklistDataTasklist" resource="http://uri/of/task/list" typeof="ext:Tasklist"/>
  <div property="ext:tasklistDataState" content="initialized">initialized</div>
</div>

<div id="a-uuid" property="ext:tasklistDataHintText">Insert your task list.</div>
```
* The plugin will notify the hintsregsitry once it finds `property="ext:tasklistDataHintText"`.
* You are in charge of making sure `<div property="ext:idInSnippet" content="u-uuid">a-uuid</div>` and ` id="a-uuid"` are in sync and unique.
* The variable state should be defined in template as 'intialized'. This will change to 'syncing' once the user inserted a tasklist.
* Currently, in most of the editor cases, template-plugin will make sure ID's are managed.
* `class="ext_tasklist_data"` is optional, but makes your `ext:TasklistData` invisible.

In host app:  styles/app.scss:
```
@import 'ember-rdfa-editor-document-tasklist-plugin';
```

The availible information is a property of the service and called `tasklistData = A()`.

TODO
------------------------------------------------------------------------------
* Heavy copy pasting of https://github.com/lblod/ember-rdfa-editor-template-variables-manager-plugin
* Documenting


Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
