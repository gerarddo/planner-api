import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import * as fs from 'fs';
import {Parser} from 'json2csv';
import path from 'path';

const CSVBOX = path.resolve(__dirname, '../../data'); // directory where csv file will be stored
const EXPENSESFILENAME = 'expenses.csv'
@injectable({scope: BindingScope.TRANSIENT})
export class JsonToCsvService {
  constructor(/* Add @inject to inject parameters */) { }

  public csvBoxPath: string = CSVBOX
  public expensesFileName: string = EXPENSESFILENAME
  /*
   * Add service methods here
   */

  expenses(): string {

    const myData = [
      {
        "car": "Audi",
        "price": 40000,
        "color": "blue"
      }, {
        "car": "BMW",
        "price": 35000,
        "color": "black"
      }, {
        "car": "Porsche",
        "price": 60000,
        "color": "green"
      }
    ];

    const fields = [{
      label: 'Car Name',
      value: 'car'
    }, {
      label: 'Price USD',
      value: 'price'
    }];

    const filePath = path.join(CSVBOX, EXPENSESFILENAME)

    try {
      const parser = new Parser({fields});
      const csv = parser.parse(myData);
      console.log(csv);
      fs.writeFile(filePath, csv, function (err) {
        if (err) throw err;
        console.log(filePath + ' saved');
      });
    } catch (err) {
      console.error(err);
    }


    return filePath

  }

}
