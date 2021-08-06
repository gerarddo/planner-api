import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  Expense,
  Entry,
} from '../models';
import {ExpenseRepository} from '../repositories';

export class ExpenseEntryController {
  constructor(
    @repository(ExpenseRepository)
    public expenseRepository: ExpenseRepository,
  ) { }

  @get('/expenses/{id}/entry', {
    responses: {
      '200': {
        description: 'Entry belonging to Expense',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Entry)},
          },
        },
      },
    },
  })
  async getEntry(
    @param.path.string('id') id: typeof Expense.prototype.id,
  ): Promise<Entry> {
    return this.expenseRepository.entry(id);
  }
}
