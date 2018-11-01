import Service from '@ember/service';
import { task } from 'ember-concurrency';
import TasklistDataDomManipulation from '../mixins/tasklist-data-dom-manipulation';
import { A } from '@ember/array';

/**
 * Service responsible for correct annotation of dates
 *
 * @module editor-document-tasklist-plugin
 * @class RdfaEditorDocumentTasklistPlugin
 * @constructor
 * @extends EmberService
 */
const RdfaEditorDocumentTasklistPlugin = Service.extend(TasklistDataDomManipulation, {

  //public
  tasklistData: null,
  /**
   * Restartable task to handle the incoming events from the editor dispatcher
   *
   * @method execute
   *
   * @param {string} hrId Unique identifier of the event in the hintsRegistry
   * @param {Array} contexts RDFa contexts of the text snippets the event applies on
   * @param {Object} hintsRegistry Registry of hints in the editor
   * @param {Object} editor The RDFa editor instance
   *
   * @public
   */
  execute: task(function * (hrId, contexts, hintsRegistry, editor, extraInfo = []) {
    if (contexts.length === 0) return [];

     //if we see event was triggered by this plugin, ignore it
    if(extraInfo.find(i => i && i.who == "editor-plugins/document-tasklist-card"))
      return [];

    let flatTasklistData = this.manageTasklistMetadata(editor);
    flatTasklistData
      .filter(d => d.tasklistDataState == 'initialized')
      .forEach(d => {
        this.setTasklistDataState(editor, d.tasklistDataMeta, 'syncing');
        d.tasklistDataState = 'syncing';
      });
    this.publish(flatTasklistData, editor);

  }).restartable(),

  publish(flatTasklistData, editor){
    if(!this.tasklistData){
      this.set('tasklistData', A());
    }
    let oldData = this.tasklistData.map(d => d.tasklistData);
    let dataToPublish = flatTasklistData
          .filter(d => d.tasklistDataState == 'syncing')
          .reverse(); //TODO: fix reverse hack

    if(!this.differentTasklists(oldData, dataToPublish))
      return;

    dataToPublish = dataToPublish.map(tasklistData => {
            return {editor, tasklistData};
          });

    //check if different..
    this.tasklistData.setObjects(dataToPublish);
  },

  differentTasklists(oldList, newList){
    if(oldList.length !== newList.length)
      return true;
    if(oldList.length === 0)
      return false;
    if(oldList[0].tasklistDataState !== newList[0].tasklistDataState)
      return true;
    if(oldList[0].intentionUri !== newList[0].intentionUri)
      return true;
    if(oldList[0].tasklistSolutionUri && oldList[0].tasklistSolutionUri !== newList[0].tasklistSolutionUri)
      return true;
    return this.differentTasklists(oldList.slice(1), newList.slice(1));
  },

  publishNewTask(editor){
    this.publish(this.flatTasklistDataInstanceData(editor), editor);
  },

  //public
  setTaskSolutionUri(tasklistData, solutionUri){
    this.setTasklistSolutionUri(tasklistData.editor, tasklistData.tasklistData.tasklistDataMeta, solutionUri);
  },

  //public
  flushTaskData(tasklistData){
    this.set('tasklistData', A());
  }
});

RdfaEditorDocumentTasklistPlugin.reopen({
  who: 'editor-plugins/document-tasklist-card'
});
export default RdfaEditorDocumentTasklistPlugin;
