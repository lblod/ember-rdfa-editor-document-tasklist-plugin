import { reads } from '@ember/object/computed';
import Component from '@ember/component';
import layout from '../../templates/components/editor-plugins/document-tasklist-card';
import TasklistDataDomManipulation from '../../mixins/tasklist-data-dom-manipulation';
import { inject as service } from '@ember/service';

/**
* Card displaying a hint of the Date plugin
*
* @module editor-document-tasklist-plugin
* @class DocumentTasklistCard
* @extends Ember.Component
*/
export default Component.extend(TasklistDataDomManipulation, {
  layout,
  rdfaEditorDocumentTasklistPlugin: service(),

  /**
   * Region on which the card applies
   * @property location
   * @type [number,number]
   * @private
  */
  location: reads('info.location'),

  /**
   * Unique identifier of the event in the hints registry
   * @property hrId
   * @type Object
   * @private
  */
  hrId: reads('info.hrId'),

  /**
   * The RDFa editor instance
   * @property editor
   * @type RdfaEditor
   * @private
  */
  editor: reads('info.editor'),

  /**
   * Hints registry storing the cards
   * @property hintsRegistry
   * @type HintsRegistry
   * @private
  */
  hintsRegistry: reads('info.hintsRegistry'),

  taskInstanceData: reads('info.taskInstanceData'),

  actions: {
    insert(){
      let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
      this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), 'editor-plugins/document-tasklist-card');
      //node instance verwijderen
      this.editor.removeNode(this.taskInstanceData.tasklistDataInstance, [ { who: "editor-plugins/document-tasklist-card" } ]);
      this.setTasklistDataState(this.editor,
                                this.taskInstanceData.tasklistDataMeta,
                                "syncing",
                                [ { who: "editor-plugins/document-tasklist-card" } ]);
      this.rdfaEditorDocumentTasklistPlugin.publishNewTask(this.editor, this.taskInstanceData);
    },
    remove(){
      let mappedLocation = this.get('hintsRegistry').updateLocationToCurrentIndex(this.get('hrId'), this.get('location'));
      this.get('hintsRegistry').removeHintsAtLocation(this.get('location'), this.get('hrId'), 'editor-plugins/document-tasklist-card');
      this.editor.removeNode(this.taskInstanceData.tasklistDataInstance, [ { who: "editor-plugins/document-tasklist-card" } ]);
      this.editor.removeNode(this.taskInstanceData.tasklistDataMeta, [ { who: "editor-plugins/document-tasklist-card" } ]);
    }
  }
});
