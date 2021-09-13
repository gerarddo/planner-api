import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import * as fs from 'fs';
import {Parser} from 'json2csv';
import path from 'path';
import {Entry, Expense} from '../models';
import {EntryRepository, ExpenseRepository} from '../repositories';

const CSVBOX = path.resolve(__dirname, '../../data'); // directory where csv file will be stored
const EXPENSESFILENAME = 'expenses.csv'
const ENTRIESFILENAME = 'entries.csv'
@injectable({scope: BindingScope.TRANSIENT})
export class JsonToCsvService {
  constructor(
    @repository(EntryRepository) public entryRepository: EntryRepository,
    @repository(ExpenseRepository) public expenseRepository: ExpenseRepository
  ) { }

  public csvBoxPath: string = CSVBOX
  public expensesFileName: string = EXPENSESFILENAME
  public entriesFileName: string = ENTRIESFILENAME

  /*
   * Add service methods here
   */

  async expenses(): Promise<string | null> {

    const expenses = await this.getExpenses();;
    const filePath = path.join(CSVBOX, EXPENSESFILENAME)

    try {
      const parser = new Parser();
      const csv = parser.parse(expenses);
      fs.writeFile(filePath, csv, function (err) {
        if (err) throw err;
        console.log(filePath + ' saved');
      });
      return filePath
    } catch (err) {
      console.error(err);
      return null
    }
  }

  async entries(): Promise<string | null> {

    const entries = await this.getEntries();
    const filePath = path.join(CSVBOX, ENTRIESFILENAME)

    try {
      const parser = new Parser();
      const csv = parser.parse(entries);
      fs.writeFile(filePath, csv, function (err) {
        if (err) throw err;
        console.log(filePath + ' saved');
      });
      return filePath
    } catch (err) {
      console.error(err);
      return null
    }
  }

  async getEntries(): Promise<Entry[]> {
    return this.entryRepository.find()
  }

  async getExpenses(): Promise<Expense[]> {
    return this.expenseRepository.find()
  }


}
