'use strict';
var assign = require('object-assign');
var babel = require('babel-core');
var pkg = require('./package.json');
var tryCatchVisitor = require('./src/visitor');
/**
 * 解析 AST
 * 遍历添加try catch
 * 返回内容
 * @param content String source file
 * @param conf Object config
 *  sourceRoot: process.cwd(),
    filename: file.path,
    filenameRelative: path.relative(process.cwd(), file.path),
    sourceMap: Boolean(file.sourceMap)
    errorHandleFuncName: '' // how to deal error
 * @return string after add try catch format
 */
function autoTryCatch(content, conf) {
    var options = assign({}, {
        __version: pkg.version
    }, conf);
    var formatContent = content;
    // parse code->AST
    // traverse & add try-catch  AST-> new AST
    // generate new AST->code
    try {
        var result = babel.transform(content, {
            parserOpts: {
                sourceType: 'module',
                plugins: [
                    'asyncGenerators',
                    'classConstructorCall',
                    'classProperties',
                    'decorators',
                    'doExpressions',
                    'exportExtensions',
                    'flow',
                    'functionSent',
                    'functionBind',
                    'jsx',
                    'objectRestSpread',
                    'dynamicImport',
                ],
            },
            babelrc: false,
            plugins: [tryCatchVisitor(babel, options)],
            sourceMaps: true,
        });
        formatContent = result.code;
    } catch (error) {
        console.error('generate error', filename, error);
    }
    return formatContent;
}

// 默认的catch error 处理方法，以及上报处理
window.GFS_TRY_CATCH_ERROR_HANDLE = function(ERROR_VARIABLE_NAME, FILENAME, FUNCTION_NAME, LINE, COLUMN){
    try{
        window.pmlogger.error({
            msg: {
                ERROR_VARIABLE_NAME: ERROR_VARIABLE_NAME,
                filename: FILENAME,
                functionName: FUNCTION_NAME
            },
            target: window.location.href,
            rowNum: LINE,
            colNum: COLUMN,
            type:2
        })
    }catch(e){
        console.error('[window.pmlogger.error] not config, Please config global logger object with "error" function handler.')
    }
}
module.exports = autoTryCatch;