import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef, param, patch, post, put, requestBody
} from '@loopback/rest';
import {Expense} from '../models';
import {ExpenseRepository} from '../repositories';

type MonthOptions = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;


export class ExpenseController {
  constructor(
    @repository(ExpenseRepository)
    public expenseRepository: ExpenseRepository,
  ) { }

  @post('/expenses', {
    responses: {
      '200': {
        description: 'Expense model instance',
        content: {'application/json': {schema: getModelSchemaRef(Expense)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Expense, {
            title: 'NewExpense',
            exclude: ['id'],
          }),
        },
      },
    })
    expense: Omit<Expense, 'id'>,
  ): Promise<Expense> {
    return this.expenseRepository.create(expense);
  }

  @get('/expenses/count', {
    responses: {
      '200': {
        description: 'Expense model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(Expense) where?: Where<Expense>,
  ): Promise<Count> {
    return this.expenseRepository.count(where);
  }

  @get('/expenses', {
    responses: {
      '200': {
        description: 'Array of Expense model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Expense, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.query.boolean('flat') flat: boolean = false,
    @param.filter(Expense) filter?: Filter<Expense>,
  ): Promise<Expense[]> {


    if (flat) {
      filter = {}
    } else {
      filter = {"include": [{"relation": "entry"}]}
    }

    return this.expenseRepository.find(filter);
  }

  @get('/expenses-unassigned', {
    responses: {
      '200': {
        description: 'Array of Expense model instances that do not belong to any entry.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Expense, {includeRelations: false}),
            },
          },
        },
      },
    },
  })
  async findUnassigned(
    @param.query.number('month') month?: MonthOptions,
    @param.query.number('year') year?: number,
    @param.filter(Expense) filter?: Filter<Expense>,
  ): Promise<Expense[]> {



    let today = new Date()

    let months = [
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
      '09',
      '10',
      '11',
      '12',
    ]

    let sMonth = months[today.getMonth()]
    let sYear = today.getFullYear().toString()

    if (month !== undefined) {
      sMonth = months[month]
    }

    if (year !== undefined) {
      sYear = year.toString()
    }

    filter = {
      'order': ['ymd DESC'],
      'where': {
        'and': [
          {'ymd': {'gt': new Date(sYear + '-' + sMonth + '-01T00:00:00.000Z')}},
          {'ymd': {'lt': new Date(sYear + '-' + sMonth + '-31T00:00:00.000Z')}}
        ]
      }
    }

    return this.expenseRepository.find(filter).then((expenses: Expense[]) => {
      let unassigned: Expense[] = []
      console.log(expenses)
      expenses.forEach((el) => {
        if (el.entryId == undefined) {
          unassigned.push(el)
        }
      })
      return unassigned
    })

  }


  @patch('/expenses', {
    responses: {
      '200': {
        description: 'Expense PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Expense, {partial: true}),
        },
      },
    })
    expense: Expense,
    @param.where(Expense) where?: Where<Expense>,
  ): Promise<Count> {
    return this.expenseRepository.updateAll(expense, where);
  }

  @get('/expenses/{id}', {
    responses: {
      '200': {
        description: 'Expense model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Expense, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Expense, {exclude: 'where'}) filter?: FilterExcludingWhere<Expense>
  ): Promise<Expense> {
    filter = {"include": [{"relation": "entry"}]}
    return this.expenseRepository.findById(id, filter);
  }

  @patch('/expenses/{id}', {
    responses: {
      '204': {
        description: 'Expense PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Expense, {partial: true}),
        },
      },
    })
    expense: Expense,
  ): Promise<void> {
    console.log('patchh')
    console.log(expense)
    await this.expenseRepository.updateById(id, expense);
  }

  @put('/expenses/{id}', {
    responses: {
      '204': {
        description: 'Expense PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() expense: Expense,
  ): Promise<void> {
    console.log('puttt')

    await this.expenseRepository.replaceById(id, expense);
  }

  @del('/expenses/{id}', {
    responses: {
      '204': {
        description: 'Expense DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.expenseRepository.deleteById(id);
  }
}