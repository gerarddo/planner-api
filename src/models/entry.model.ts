import {Entity, hasMany, model, property} from '@loopback/repository';
import {Expense, ExpenseWithRelations} from './expense.model';

@model()
export class Entry extends Entity {

  constructor(data?: Partial<Entry>) {
    super(data);
  }

  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'date',
    required: true,
    jsonSchema: {
      format: 'date',
    }
  })
  ymd: Date;

  @property({
    type: 'string',
    required: true,
  })
  description: string;

  @property({
    type: 'string',
    required: true,
  })
  tags: string;

  @property({
    type: 'string',
    required: true,
  })
  method: string;

  @property({
    type: 'number',
    required: true,
  })
  inflow: number;

  @hasMany(() => Expense)
  expenses: Expense[];
  @property({
    type: 'number',
    required: true,
  })
  outflow: number;


}

export interface EntryRelations {
  // describe navigational properties here
  expenses?: ExpenseWithRelations;

}

export type EntryWithRelations = Entry & EntryRelations;
