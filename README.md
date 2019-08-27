@lblod/ember-rdfa-editor-document-tasklist-plugin
==============================================================================

Plugin for extracting information about a  **predefined** tasklist linked to a document and publishing it.
This is useful when a particular template is associated with a predefined list of tasks of which a user needs to keep track of.
And this every time the template is instantiated.


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
The primary function of this plugin is to scan the RDFA content of the document and check whether there is
info available about a predefined tasklist linked with the document. And provide this to the consumer.

The second functionality is to store the tasklist-solution associated to the task list in the document.

The tasks themselves or the task-solutions (i.e is the task solved or not) are not stored in the document. These will need to be stored elsewhere.

### Defined model
The model is defined in [ember-vo-tasklist](https://github.com/lblod/ember-vo-tasklist) addon.
In [models folder](https://github.com/lblod/ember-vo-tasklist/tree/master/addon/models).

### In editor-document-template

To tell the plugin to publish the data, insert the following in your plugin.
```
<div class="ext_tasklist_data" typeof="ext:TasklistData" resource="http://task/list/data">
  <div property="ext:idInSnippet" content="a-uuid">a-uuid</div>
  <meta property="ext:tasklistDataTasklist" resource="http://uri/of/task/list" typeof="ext:Tasklist"/>
  <div property="ext:tasklistDataState" content="initialized">initialized</div>
</div>

<div id="a-uuid" property="ext:tasklistDataHintText">Do you want to insert a tasklist associated with this template?</div>
```
* The plugin will notify the hintsregsitry once it finds `property="ext:tasklistDataHintText"`.
* You are in charge of making sure `<div property="ext:idInSnippet" content="u-uuid">a-uuid</div>` and ` id="a-uuid"` are in sync and unique.
  If you use the [ember-rdfa-editor-standard-template-plugin](https://github.com/lblod/ember-rdfa-editor-standard-template-plugin), it will make sure ID's are managed with `${generateUuid()}` or `${generateBoundUuid('instance-1')}`.
  As a result, the snippet might look like this:
```
<div class="ext_tasklist_data" typeof="ext:TasklistData" resource="http://task/list/data">
  <div property="ext:idInSnippet" content="${generateBoundUuid('tasklist-1')}">a-uuid</div>
  <meta property="ext:tasklistDataTasklist" resource="http://uri/of/task/list" typeof="ext:Tasklist"/>
  <div property="ext:tasklistDataState" content="initialized">initialized</div>
</div>

<div id="${generateBoundUuid('tasklist-1')}" property="ext:tasklistDataHintText">Do you want to insert a tasklist associated with this template?</div>
```
* The variable state should be defined in template as 'initialized'. This will change to 'syncing' once the user inserted a tasklist.
* `class="ext_tasklist_data"` is optional, but makes your `ext:TasklistData` invisible.

In host app:  styles/app.scss:
```
@import 'ember-rdfa-editor-document-tasklist-plugin';
```

### Manipulation of tasklist data from the plugin.

The availible tasklist information is a property of the service and called `tasklistData = A()`.
The information contained in an element of the array:
```
let taskListDataItem = {
  editor,
  tasklistData: {
    tasklistUri: "http://uri/of/task/list",
    tasklistSolutionUri: "http://uri/of/tasklistSolution"
    }
}
```
In the consumer-app you can consume these URI's.
E.g.

```
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({
  tasklistPlugin: service('rdfa-editor-document-tasklist-plugin'),
  store: service(),
  tasklistUris: computed('tasklistPlugin.[]', function(){
    return this.get('tasklistPlugin.tasklistData').map( t => t.tasklistData.tasklistUri );
  })

  action: {
   getTasksFromFirstTasklist(){
     let taskListData = this.get('tasklistPlugin.tasklistData)[0];
     //pseudocode
     this.set('tasks', this.findTasksForTasklist(taskListData.taskListUri));
   }
  }
});
```
The task list solution (i.e. whether the task has been completed or not) needs to be stored in the document, so the next time the document is loaded, the correct state of the tasklist can be retrieved. This is done with:
```
  this.get('tasklistPlugin').setTaskSolutionUri(taskListDataItem, "http://uri/of/the/tasklistSolution")
```

TODO
------------------------------------------------------------------------------
* Heavy copy pasting of https://github.com/lblod/ember-rdfa-editor-template-variables-manager-plugin


Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
