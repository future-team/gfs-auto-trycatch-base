const autoTryCatch = require('../index.js');
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
      throw _e;
    }
  }
  action() {
    try {
      console.log('this name is: ', this.name);
    } catch (_e2) {
      window.GFS_TRY_CATCH_ERROR_HANDLE && window.GFS_TRY_CATCH_ERROR_HANDLE(_e2, "", "action", 6, 2);
      throw _e2;
    }
  }
}*/