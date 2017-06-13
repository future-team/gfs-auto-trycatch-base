/**
 * customer vistor modify ast
 */
var nodePath = require('path');
var nameFunction = require('babel-helper-function-name');
var template = require('babel-template');
var types = require('babel-types');

var wrapFunction = template(`{
  try {
    BODY
  } catch(ERROR_VARIABLE_NAME) {
    window.REPORT_ERROR && window.REPORT_ERROR(ERROR_VARIABLE_NAME, FILENAME, FUNCTION_NAME, LINE, COLUMN)
    !window.REPORT_ERROR && window.pmlogger && window.pmlogger.error && typeof window.pmlogger.error == 'function' && window.pmlogger.error({
        msg: JSON.stringify({
            error_variable_name: ERROR_VARIABLE_NAME,
            filename: FILENAME,
            function_name: FUNCTION_NAME
        }),
        target: window.location.href,
        rowNum: LINE,
        colNum: COLUMN,
        type:2
    })
  }
}`);
var VISITED = Symbol();
module.exports = function visitor(babel, options){
  var filename = nodePath.basename(options.filenameRelative || "");
  var reportErrorFunc = options.errorHandleFuncName || 'GFS_TRY_CATCH_ERROR_HANDLE'
  return {
    name: "trycatch-transform", // not required
    visitor: {
      'Function|ClassMethod': function(path){
        // forbid duplicate deal
        if (path.node[VISITED]) return;
        try{
          var body = path.node.body.body;
          if (body && body.length === 0) {
            return;
          }
          // get location 
          var loc = path.node.loc;
          // get error variable name
          var errorVariableName = path.scope.generateUidIdentifier('e');

          // get Function name
          var functionName = 'anonymous function';
          if(path.node.id){
            functionName = path.node.id.name || 'anonymous function';
          }
          // get classMethod name
          if(path.node.key){
              functionName = path.node.key.name || 'anonymous function';
          }
          var data = {
              BODY: body,
              FILENAME: types.StringLiteral(filename),
              FUNCTION_NAME: types.StringLiteral(functionName),
              LINE: types.NumericLiteral(loc.start.line),
              COLUMN: types.NumericLiteral(loc.start.column),
              REPORT_ERROR: types.identifier(reportErrorFunc),
              ERROR_VARIABLE_NAME: errorVariableName
          }
          path.get('body').replaceWith(wrapFunction(data));
          path.node[VISITED] = true;
        }catch(ex){
          console.error('Function visitor error', ex);
        }
      }
    }
  }; 
}