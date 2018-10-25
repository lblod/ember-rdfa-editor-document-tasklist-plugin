import Mixin from '@ember/object/mixin';
/**
 * This mixin contains logic to manipulate the DOM linked to the TasklistMetaData
 *************
 * WARNING
 *************
 * The logic contained in here is a brutal copy paste + tweak from what has been written
 * https://github.com/lblod/ember-rdfa-editor-template-variables-manager-plugin
 * A least this logic is concentrated on ONE visible place IN this plugin
 */
export default Mixin.create({

  manageTasklistMetadata(editor){
    let metadataBlock = this.fetchOrCreateMetadataBlock(editor);
    this.moveTasklistDataToMetaBlock(editor, metadataBlock);
    return this.flatTasklistDataInstanceData(editor);
  },

  /**
   * When new template is added, it might contain variableMetaData.
   * We want to move these nodes to a (dom) MetaDataBlock at the beginning of the document.
   * @param {Object} editor
   * @param {Object} domNode containing the centralized meta data block
   */
  moveTasklistDataToMetaBlock(editor, variablesBlock){
    let variables = [ ...editor.rootNode.querySelectorAll("[typeof='ext:TasklistData']")];
    variables = variables.filter(node => !variablesBlock.contains(node));

    variables.forEach(v => {
      let variableHtml = v.outerHTML;
      editor.prependChildrenHTML(variablesBlock, variableHtml, false, [ this ]);
      editor.removeNode(v, [ this ]);
    });
  },

  /**
   * We want to fetch or create the metadata block in the editor-document.
   * This will containing the meta data of the variables
   * @param {Object} editor
   *
   * @return {Object} domNode containing the centralized meta data block
   */
  fetchOrCreateMetadataBlock(editor){
    let variablesBlock = [ ...editor.rootNode.querySelectorAll("[property='ext:metadata']")];
    if(variablesBlock.length > 0){
      return variablesBlock[0];
    }
    return editor.prependChildrenHTML(editor.rootNode,
                                      `<div class="ext_metadata" contenteditable="false" property="ext:metadata">
                                       &nbsp;
                                       </div>`,
                                      true, [ this ])[0];
  },


  /**
   * Find all TasklistDataInstances and return as list together with some meta data
   * @param {Object} editor
   *
   * @return {Array} [{intentionUri, TasklistDataInstance, variabelState, TasklistDataMeta}]
   */
  flatTasklistDataInstanceData(editor){
    let tasklistDatas = [ ...editor.rootNode.querySelectorAll("[typeof='ext:TasklistData']")];
    return tasklistDatas.map( tasklistData => {
      return {
        tasklistDataState: this.getTasklistDataState(tasklistData),
        tasklistDataMeta: tasklistData,
        tasklistUri: this.getTasklistUri(tasklistData),
        tasklistSolutionUri: this.getTasklistSolutionUri(tasklistData)
      };
    });
  },

  getTasklistUri(domRdfaTasklistData){
    let tasklistDataUriProp = [...domRdfaTasklistData.children].find(child => child.attributes.property.value === 'ext:tasklistDataTasklist');
    if(tasklistDataUriProp)
      return tasklistDataUriProp.attributes.resource.value;
    return '';
  },

  getTasklistSolutionUri(domRdfaTasklistData){
    let tasklistDataUriProp = [...domRdfaTasklistData.children].find(child => child.attributes.property.value === 'ext:tasklistDataTasklistSolution');
    if(tasklistDataUriProp)
      return tasklistDataUriProp.attributes.resource.value;
    return '';
  },

  setTasklistSolutionUri(editor, tasklistDataMeta, tasklistSolutionUri, extraInfo = [ this ] ){
    let html = `<meta property="ext:tasklistDataTasklistSolution" resource="${tasklistSolutionUri}" typeof="ext:TasklistSolution"/>`;
    //TODO:  check if domNode stil there
    editor.prependChildrenHTML(tasklistDataMeta, html, false, extraInfo);
  },

  /**
   * Returns state of MetaTasklistDataData linked to domnode
   * @param {Object} domNode
   *
   * @return {String}
   */
  getTasklistDataState(domRdfaTasklistData){
    let tasklistDataStateProp = [...domRdfaTasklistData.children].find(child => child.attributes.property.value === 'ext:tasklistDataState');
    if(tasklistDataStateProp)
      return tasklistDataStateProp.attributes.content.value;
    return '';
  },

  /**
   * Sets state of MetaTasklistDataData linked to domnode
   * @param {Object} domNode
   */
  setTasklistDataState(editor, domRdfaTasklistData, stateName, extraInfo = [ this ]){
    let tasklistDataStateProp = [...domRdfaTasklistData.children].find(child => child.attributes.property.value === 'ext:tasklistDataState');
    if(tasklistDataStateProp)
      editor.replaceNodeWithHTML(tasklistDataStateProp,
                                 `<div property="ext:tasklistDataState" content="${stateName}">${stateName}</div>`,
                                 false, extraInfo);
  },

  /**
   * Returns TasklistData dom-instance linked to MetaTasklistDataData
   * @param {Object} domNode
   *
   * @return {Object} domNode
   */
  getTasklistDataDomInstance(domRdfaTasklistData){
    let domId =  [...domRdfaTasklistData.children].find(child => child.attributes.property.value === 'ext:idInSnippet').attributes.content.value;
    return document.querySelectorAll(`[id='${domId}']`)[0];
  }
});
