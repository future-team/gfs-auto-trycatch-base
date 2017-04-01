'use strict';
var path = require('path');
var babel = require('babel-core');
var babelTemplate = require('babel-template');
// var babelGenerator = require('babel-generator');

var babelTypes = babel.types;
var babelGenerator = require('babel-core/lib/generation')
//遍历整个语法解析树
function traversal(node, func) {
    func(node);
    for (var key in node) {
        if (node.hasOwnProperty(key)) {
            var child = node[key];
            if (typeof child === 'object' && child !== null) {
                if (Array.isArray(child)) {
                    child.forEach(function (node) {
                        traversal(node, func);
                    });
                } else {
                    traversal(child, func);
                }
            }
        }
    }
}

const wrapFunction = babelTemplate(`{
  try {
    BODY
  } catch(ERROR_VARIABLE_NAME) {
    REPORT_ERROR(ERROR_VARIABLE_NAME, FILENAME, FUNCTION_NAME, LINE)
    throw ERROR_VARIABLE_NAME
  }
}`)

/**
 * 解析 AST
 * 遍历添加try catch
 * 返回内容
 * @param content String source file
 * @param file Vinyl file object
 * @param conf Object config
 * @return string after add try catch format
 */
function autoTryCatch(content, conf) {
    var fileName = conf.filename
    var filePath = conf.path
    var formatContent = content

    // parse
    try {
        /**
         * APIs: 'register', 'polyfill', 'transformFile', 'transformFileSync', 'parse', 'util', 'acorn', 'transform', 'pipeline', 'canCompile', 'File', 'options', 'Plugin', 'Transformer', 'Pipeline', 'traverse', 'buildExternalHelpers', 'version', 'types'
         */
        var parse = babel.parse(content, {
            "stage": 0,
            "loose": "all"
        });
        console.log('Object.keys(parse)', Object.keys(parse))
    } catch (error) {
        console.log('babel.parse', filePath, error);
    }
    // traverse
    try {
        babel.traverse(parse, {
            noScope: true,

            enter: function(path){
                console.log('enter', path)
            },
            exit: function(path){
                console.log('exit', path)
            }
        });
    }catch(error){
        console.log('babel.traverse', error)
    }
    // generate
    try {
        // 如何生成代码？
        var output = babelGenerator(parse, {}, content)
        // var output = babel.transform(content, {
        //     "stage": 0,
        //     "loose": "all"
        // })
        formatContent = output.code
    } catch (error) {
        console.log('babelGenerator', fileName, error)
    }
    return formatContent;
}
module.exports = autoTryCatch;