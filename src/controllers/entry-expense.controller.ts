import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody
} from '@loopback/rest';
import {
  Entry,
  Expense
} from '../models';
import {EntryRepository} from '../repositories';

export class EntryExpenseController {
  constructor(
    @repository(EntryRepository) protected entryRepository: EntryRepository,
  ) { }

  @get('/entries/{id}/expenses', {
    responses: {
      '200': {
        description: 'Array of Entry has many Expense',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Expense)},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<Expense>,
  ): Promise<Expense[]> {
    filter = {"include": [{"relation": "entry"}]}
    return this.entryRepository.expenses(id).find(filter);
  }

  @post('/entries/{id}/expenses', {
    responses: {
      '200': {
        description: 'Entry model instance. This endpoint will create an \
        expense record in database and automatically associate it to the entry \
        with id given as path parameter.',
        content: {'application/json': {schema: getModelSchemaRef(Expense)}},
      },
    },
  })
  async create(
    @param.path.string('id') id: typeof Entry.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Expense, {
            title: 'NewExpenseInEntry',
            exclude: ['id'],
            optional: ['entryId']
          }),
        },
      },
    }) expense: Omit<Expense, 'id'>,
  ): Promise<Expense> {
    return this.entryRepository.expenses(id).create(expense);
  }

  @patch('/entries/{id}/expenses', {
    responses: {
      '200': {
        description: 'Entry.Expense PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Expense, {partial: true}),
        },
      },
    })
    expense: Partial<Expense>,
    @param.query.object('where', getWhereSchemaFor(Expense)) where?: Where<Expense>,
  ): Promise<Count> {
    return this.entryRepository.expenses(id).patch(expense, where);
  }

  @del('/entries/{id}/expenses', {
    responses: {
      '200': {
        description: 'Entry.Expense DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(Expense)) where?: Where<Expense>,
  ): Promise<Count> {
    return this.entryRepository.expenses(id).delete(where);
  }
}
