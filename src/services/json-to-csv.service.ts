import { /* inject, */ BindingScope, injectable} from '@loopback/core';
const {AsyncParser} = require('json2csv');

@injectable({scope: BindingScope.TRANSIENT})
export class JsonToCsvService {
  constructor(/* Add @inject to inject parameters */) { }

  /*
   * Add service methods here
   */

  run() {
    const fields = ['field1', 'field2', 'field3'];
    const opts = {fields};
    const asyncParser = new AsyncParser(opts);

  }

}
