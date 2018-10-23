import Service from '@ember/service';
import EmberObject from '@ember/object';
import { task } from 'ember-concurrency';
import TasklistDataDomManipulation from '../mixins/tasklist-data-dom-manipulation';
import { A, isArray } from '@ember/array';
import { warn } from '@ember/debug';

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
        let richNodes = isArray(context.richNode) ? context.richNode : [ context.richNode ];
        let domNode = richNodes
              .map(r => this.getDomElementForRdfaInstructiveContext(editor.rootNode, r.domNode, relevantContext.predicate))
              .find(d => d);
        if(!domNode){
          warn(`Trying to work on unattached domNode. Sorry can't handle these...`, {id: 'document-tasklist-plugin.domNode'});
          return;
        }

        hintsRegistry.removeHintsInRegion(context.region, hrId, this.get('who'));
        hints.pushObjects(this.generateHintsForContext(context, flatTasklistData, domNode));
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
    if(context.context.slice(-1)[0].predicate == "http://mu.semte.ch/vocabularies/ext/tasklistDataHintText"){
      return context.context.slice(-1)[0];
    }
    return null;
  },

  /**
   * Find matching domNode for RDFA instructive.
   * We don't exactly know where it is located, hence some walking back.
   */
  getDomElementForRdfaInstructiveContext(rootNode, domNode, instructiveRdfa){
    let ext = 'http://mu.semte.ch/vocabularies/ext/';
    if(!domNode || rootNode.isEqualNode(domNode)) return null;
    if(!domNode.attributes || !domNode.attributes.property){
      return this.getDomElementForRdfaInstructiveContext(rootNode, domNode.parentElement, instructiveRdfa);
    }

    let expandedProperty = domNode.attributes.property.value.replace('ext:', ext);
    if(instructiveRdfa == expandedProperty)
      return domNode;
    return this.getDomElementForRdfaInstructiveContext(rootNode, domNode.parentElement, instructiveRdfa);
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
  generateHintsForContext(context, flatTasklistData, domNode){
    const hints = [];
    const text = context.text;
    const location = context.region;
    const taskInstanceData = this.getTasklistData(domNode, flatTasklistData);
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

  differentTasklists(listA, listB){
    if(listA.length !== listB.length)
      return true;
    if(listA.length === 0)
      return false;
    if(listA[0].tasklistDataState !== listB[0].tasklistDataState)
      return true;
    if(listA[0].intentionUri !== listB[0].intentionUri)
      return true;
    return this.differentTasklists(listA.slice(1), listB.slice(1));
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
