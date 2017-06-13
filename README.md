# gfs-auto-trycatch-base
Auto add try-catch wrap for function base util.

## Options

- `sourceRoot`: the code source root path
- `filename`: in fact this option is `file path`
- `filenameRelative`: file name
- `sourceMap`: code source map file content, default is `false`
- `errorHandleFuncName` : error handler function name, default is `GFS_TRY_CATCH_ERROR_HANDLE`, `NOTE`: this function name must be defined global. If this handler not defined, then will try to use default `pmlogger.error` handle error.
## Usage
```bash
$ npm install gfs-auto-trycatch --save-dev
```

```javascript
const autoTryCatch = require('gfs-auto-trycatch');
const codeContent = `
class Demo {
  consturctor(){
    this.name = "demo"
  }
  action(){
    console.log('this name is: ', this.name)
  }
}
`
const newCtn = autoTryCatch(codeContent, {});

console.log(newCtn);
//  after add try catch
/*class Demo {
  consturctor() {
    try {
      this.name = "demo";
    } catch (_e) {
      window.GFS_TRY_CATCH_ERROR_HANDLE && window.GFS_TRY_CATCH_ERROR_HANDLE(_e, "", "consturctor", 3, 2);
      !window.REPORT_ERROR && window.pmlogger && window.pmlogger.error && typeof window.pmlogger.error == 'function' && window.pmlogger.error({
          msg: JSON.stringify({
              error_variable_name: _e,
              filename: "",
              function_name: "consturctor"
          }),
          target: window.location.href,
          rowNum: 3,
          colNum: 2,
          type:2
      })
    }
  }
  action() {
    try {
      console.log('this name is: ', this.name);
    } catch (_e2) {
      window.GFS_TRY_CATCH_ERROR_HANDLE && window.GFS_TRY_CATCH_ERROR_HANDLE(_e2, "", "action", 6, 2);
      !window.REPORT_ERROR && window.pmlogger && window.pmlogger.error && typeof window.pmlogger.error == 'function' && window.pmlogger.error({
          msg: JSON.stringify({
              error_variable_name: _e2,
              filename: "",
              function_name: "consturctor"
          }),
          target: window.location.href,
          rowNum: 6,
          colNum: 2,
          type:2
      })
    }
  }
}*/
```
