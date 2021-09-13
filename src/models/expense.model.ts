import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Entry, EntryWithRelations} from './entry.model';

@model()
export class Expense extends Entity {

  constructor(data?: Partial<Expense>) {
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

  @property.array(String)
  tags: string[];

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

  @belongsTo(() => Entry)
  entryId: string;

  @property({
    type: 'number',
    required: true,
  })
  outflow: number;


}

export interface ExpenseRelations {
  // describe navigational properties here
  entry?: EntryWithRelations;

}

export type ExpenseWithRelations = Expense & ExpenseRelations;
