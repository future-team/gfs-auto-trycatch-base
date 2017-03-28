'use strict';
var esprima = require('esprima');

var START_MARKER = '/*gfs-auto-add-start*/';
var END_MARKER = '/*gfs-auto-add-end*/';

var TRY_CONTENT = "try{" + START_MARKER;
var CATCH_CONTENT = END_MARKER + "}catch(e){console.error('do error handle staff', e)}";

var START_MARKER_REG = /\/\*gfs-auto-add-start\*\//gi;
var END_MARKER_REG = /\/\*gfs-auto-add-end\*\//gi;

//遍历整个语法解析树
function traversal(node, func) {
    func(node);
    for (var key in node) {
        if (node.hasOwnProperty(key)) {
            var child = node[key];
            if (typeof child === 'object' && child !== null) {
                if (Array.isArray(child)) {
                    child.forEach(function(node) {
                        traversal(node, func);
                    });
                } else {
                    traversal(child, func);
                }
            }
        }
    }
}

function addFillIn(str, type) {
    var start_count = (str.match(START_MARKER_REG)||[]).length;
    var end_count = (str.match(END_MARKER_REG)||[]).length;
    if(start_count || end_count){
        console.log(type, str);
    }
    return start_count * START_MARKER.length + end_count * END_MARKER.length;
}

//添加try部分
function addTry(str, col) {
    return str.slice(0, col + 1) + TRY_CONTENT + str.slice(col + 1);
}

//添加catch部分
function addCatch(str, filepath, line, col, inOneLine) {
    // var _strCatch = "}catch(e){if(typeof alog != 'undefined'){alog('exception.fire','catch',{msg:e.message || e.description,path:'" + filepath + "',ln:" + line + "});}}";
    //funtion整个在一行内，需要加上 "try{" 所占的4个位置
    if(inOneLine){
        col = col + TRY_CONTENT.length;
    }
    return str.slice(0, col) + CATCH_CONTENT + str.slice(col);
}

//判断是否命中
function isHit(strFunHead, conf){
    conf = conf || {};
    var include = conf.include || null, 
        exclude = conf.exclude || null,
        toString = Object.prototype.toString;

    return !(exclude && toString.apply(exclude) == '[object RegExp]' && exclude.test(strFunHead)) && 
        (include && toString.apply(include) == '[object RegExp]' && include.test(strFunHead));
}

function modifyFunction(arrFile, node, loc, filepath, conf) {
    var _startLine = loc.start.line - 1,
        _startCol = loc.start.column,
        _endLine = loc.end.line - 1,
        _endCol = loc.end.column - 1,
        _strHead = arrFile[_startLine],
        _strEnd = arrFile[_endLine];

    if(_endCol - _startCol ==1 ){
        return false;
    }

    if(_strHead === _strEnd){
        // 过滤掉react添加的代码
        if(/REACT HOT LOADER/.test(_strHead) || /WEBPACK VAR INJECTION/.test(_strHead)){
            return false;
        }
        // TODO 如何精准判断该位置是否添加过 try or catch，以及添加了多少个？正确的补位？
        if (/try\s*\{/.test(_strHead.slice(_startCol,_endCol)) || /catch\s*\(.*\)\s*\{/.test(_strEnd.slice(_startCol, _endCol))) {
            return false;
        }
    }else{
        //排除已含有try/catch
        if (/try\s*\{/.test(_strHead) || /catch\s*\(.*\)\s*\{/.test(_strEnd)) {
            return false;
        }
    }
    addFillIn(_strHead, 'start', );
    addFillIn(_strEnd, 'end');
    //判断是否命中function名
    var hit = false;
    if(node.type == "FunctionDeclaration" && node.id && isHit(node.id.name, conf.func)){//直接函数声明，使用函数名来判断
        hit = true;
    }
    if(node.type == "FunctionExpression"){//匿名函数
        if(isHit(_strHead, conf.func)){//this.init = function(){},使用函数的第一行来判断关键字
            hit = true;
        }
        /* 支持这种写法：
         *  this.init = function()
         *  {
         *  }
         */
        else if(_strHead.replace(/[\s\t]/g, '') == "{" && _startLine >= 1 && isHit(arrFile[_startLine - 1], conf.func)){
            hit = true;
        }
        // hit = true;
    }
    if(!hit) return false;
    arrFile[_startLine] = addTry(arrFile[_startLine], _startCol, _startLine == _endLine);
    arrFile[_endLine] = addCatch(arrFile[_endLine], filepath, loc.end.line,  _endCol, _startLine == _endLine);
}

// return string
module.exports = function autoTryCatch(content, file, conf) {
    conf = {
        file: {
            include: /.js$/, //文件名的命中正则，不配置则都不命中
            exclude: /\/common\//i  //排除
        },
        func: {
            include: /\w*/i, //函数名的命中正则，不配置则都不命中
            exclude: ''  //排除
        },
        funcDeclaration: true //直接的函数声明是否也生效
    };
    var arrContent = content.split('\n');
    try {
        var _parse = esprima.parse(content, {
            loc: true //注明需要语法解析后的line、column
        });
        // 是否对直接的函数声明也需要加try/catch： 如 function init(){ ...... }
        var funcDeclaration = conf.funcDeclaration;
        traversal(_parse, function(node) {
            try {
                if (node && (node.type == "FunctionExpression" || (node.type == "FunctionDeclaration" && funcDeclaration))) {
                    modifyFunction(arrContent, node, node.body.loc, file.id, conf);
                }    
            } catch (error) {
                console.log(node, error);
            }
        });
    } catch (e) {
        console.log('some errors', e);
    }
    return arrContent.join('\n');
};