import Service from '@ember/service';
import EmberObject from '@ember/object';
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
    this.publish(flatTasklistData, editor);

    const hints = [];
    contexts.forEach((context) => {
      let relevantContext = this.detectRelevantContext(context);
      if (relevantContext) {
        hintsRegistry.removeHintsInRegion(context.region, hrId, this.get('who'));
        hints.pushObjects(this.generateHintsForContext(context, flatTasklistData));
      }
    });
    const cards = hints.map( (hint) => this.generateCard(hrId, hintsRegistry, editor, hint));
    if(cards.length > 0){
      hintsRegistry.addHints(hrId, this.get('who'), cards);
    }
  }).restartable(),

  /**
   * Given context object, tries to detect a context the plugin can work on
   *
   * @method detectRelevantContext
   *
   * @param {Object} context Text snippet at a specific location with an RDFa context
   *
   * @return {String} URI of context if found, else empty string.
   *
   * @private
   */
  detectRelevantContext(context){
    return context.context.find(t => t.predicate == "http://mu.semte.ch/vocabularies/ext/tasklistDataHintText");
  },

  /**
   * Generates a card given a hint
   *
   * @method generateCard
   *
   * @param {string} hrId Unique identifier of the event in the hintsRegistry
   * @param {Object} hintsRegistry Registry of hints in the editor
   * @param {Object} editor The RDFa editor instance
   * @param {Object} hint containing the hinted string and the location of this string
   *
   * @return {Object} The card to hint for a given template
   *
   * @private
   */
  generateCard(hrId, hintsRegistry, editor, hint){
    return EmberObject.create({
      info: {
        label: 'Wenst u een takenlijst toe te voegen?',
        plainValue: hint.text,
        location: hint.location,
        taskInstanceData: hint.taskInstanceData,
        hrId, hintsRegistry, editor
      },
      location: hint.location,
      card: this.get('who')
    });
  },

  /**
   * Generates a hint, given a context
   *
   * @method generateHintsForContext
   *
   * @param {Object} context Text snippet at a specific location with an RDFa context
   *
   * @return {Object} [{dateString, location}]
   *
   * @private
   */
  generateHintsForContext(context, flatTasklistData){
    const hints = [];
    const text = context.text;
    const location = context.region;
    const taskInstanceData = this.getTasklistData(context.richNode.domNode.parentElement, flatTasklistData);
    hints.push({text, location, taskInstanceData});
    return hints;
  },

  getTasklistData(domTasklistDataInstance, flatTasklistData){
    return flatTasklistData.find(d => d.tasklistDataInstance.isSameNode(domTasklistDataInstance));
  },

  publish(flatTasklistData, editor){
    if(!this.tasklistData){
      this.set('tasklistData', A());
    }
    let publishData = flatTasklistData
          .filter(d => d.tasklistDataState == 'syncing')
          .map(tasklistData => {
            return {editor, tasklistData};
          });
    this.tasklistData.setObjects(publishData.reverse()); //TODO: fix reverse hack
  },

  publishNewTask(editor){
    this.publish(this.flatTasklistDataInstanceData(editor), editor);
  },

  setTaskSolutionUri(tasklistData, solutionUri){
    this.setTasklistSolutionUri(tasklistData.editor, tasklistData.tasklistData.tasklistDataMeta, solutionUri);
  }
});

RdfaEditorDocumentTasklistPlugin.reopen({
  who: 'editor-plugins/document-tasklist-card'
});
export default RdfaEditorDocumentTasklistPlugin;
