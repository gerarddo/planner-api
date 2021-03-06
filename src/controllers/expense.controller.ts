import {inject} from '@loopback/core';
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
  getModelSchemaRef, HttpErrors, param, patch, post, put, requestBody, RestBindings
} from '@loopback/rest';
import {Response} from 'express';
import * as fs from 'fs';
import path from 'path';
import {Entry, Expense} from '../models';
import {ExpenseRepository} from '../repositories';
import {ExpenseLinkSuggestionsService, JsonToCsvService} from '../services';


type MonthOptions = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;


export class ExpenseController {
  constructor(
    @repository(ExpenseRepository) public expenseRepository: ExpenseRepository,
    @inject('services.JsonToCsvService') private jsonToCsvService: JsonToCsvService,
    @inject('services.ExpenseLinkSuggestionsService') private expenseLinkSuggestionsService: ExpenseLinkSuggestionsService,
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

  @post('/expenses/multiple', {
    responses: {
      '200': {
        description: 'Expense model instance',
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
  async createAll(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(Expense, {
              title: 'NewExpense',
              exclude: ['id'],
            })
          }
        },
      },
    })
    expenses: Omit<Expense, 'id'>[],
  ): Promise<Expense[]> {
    return this.expenseRepository.createAll(expenses);
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


  @get('/expenses/page', {
    responses: {
      '200': {
        description: 'Page where record(s) are logalized by a given date',
        content: {
          'application/json': {
            schema: {
              type: 'number',
            },
          },
        },
      },
    },
  })
  async currentPage(
    @param.query.number('fetchYear') fetchYear?: number,
    @param.query.number('fetchMonth') fetchMonth?: MonthOptions,
    @param.query.number('queryYear') queryYear?: number,
    @param.query.number('queryMonth') queryMonth?: number,
    @param.query.number('queryDay') queryDay?: number,
  ): Promise<{currentPage: number}> {

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

    if (fetchMonth !== undefined) {
      sMonth = months[fetchMonth]
    }

    if (fetchYear !== undefined) {
      sYear = fetchYear.toString()
    }


    const filter = {
      'order': ['ymd DESC'],
      'where': {
        'and': [
          {'ymd': {'gt': new Date(sYear + '-' + sMonth + '-01T00:00:00.000Z')}},
          {'ymd': {'lt': new Date(sYear + '-' + sMonth + '-31T00:00:00.000Z')}}
        ]
      }
    }

    const allExpenses = await this.expenseRepository.find(filter);
    return {currentPage: 2}
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
    @param.query.number('year') year?: number,
    @param.query.number('month') month?: MonthOptions,
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
      "include": [{"relation": "entry"}],
      'where': {
        'and': [
          {'ymd': {'gt': new Date(sYear + '-' + sMonth + '-01T00:00:00.000Z')}},
          {'ymd': {'lt': new Date(sYear + '-' + sMonth + '-31T00:00:00.000Z')}}
        ]
      }
    }

    return this.expenseRepository.find(filter).then((data) => {
      return data
    });
  }



  @get('/expenses/latest', {
    responses: {
      '200': {
        description: 'Array of Expense model instances from latest day registered',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Expense, {includeRelations: true}),
            }
          },
        },
      },
    },
  })
  /**
   * Function might take more time to be processed than others since it runs two
   * independent queries to the database.
   */
  async findLatest(
    @param.filter(Expense) filter?: Filter<Expense>,
  ): Promise<Expense[]> {

    filter = {
      "order": ["ymd DESC"],
      "limit": 1,
      "fields": ["ymd"]
    }

    return this.expenseRepository.find(filter).then((records: Expense[]) => {

      filter = {
        "where": {
          "ymd": {
            'eq': records[0]['ymd']
          }
        },
        "include": [{"relation": "entry"}]
      }

      return this.expenseRepository.find(filter)

    });

  }

  @get('/expenses/latest/date', {
    responses: {
      '200': {
        description: 'Array of Expense model instances from latest day registered',
        content: {
          'application/json': {
            schema: {
              type: 'string'
            },
          },
        },
      },
    },
  })
  async findLatestDate(
    @param.filter(Expense) filter?: Filter<Expense>,
  ): Promise<Date> {


    filter = {
      "order": ["ymd DESC"],
      "limit": 1,
      "fields": ["ymd"]
    }

    return this.expenseRepository.find(filter).then((records: Expense[]) => {
      return records[0]['ymd']
    });

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
    @param.query.number('year') year?: number,
    @param.query.number('month') month?: MonthOptions,
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
      "include": [{"relation": "entry"}],
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

  @get('/expenses/{id}/link-suggestions', {
    responses: {
      '200': {
        description: 'Entry model array instance',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items:
                getModelSchemaRef(Entry),
            },
          },
        },
      },
    },
  })
  async findSuggestionsById(
    @param.path.string('id') id: string
  ): Promise<Entry[]> {

    return []

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
    await this.expenseRepository.replaceById(id, expense);
  }

  @patch('/expenses/{id}/tags', {
    responses: {
      '204': {
        description: 'Expense PATCH success',
      },
    },
  })
  async updateTagsById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: {
              type: 'string'
            },
          },
        },
      }
    }) tags: string[],
  ): Promise<void> {
    await this.expenseRepository.updateById(id, {tags: tags});
  }

  @put('/expenses/{id}/reset-link', {
    responses: {
      '204': {
        description: 'Expense entryId reset success',
      },
    },
  })
  async resetLinkById(
    @param.path.string('id') id: string
  ): Promise<void> {
    await this.expenseRepository.findById(id).then((expense: Expense) => {
      let reset = new Expense();
      reset.ymd = expense.ymd
      reset.description = expense.description
      reset.tags = expense.tags
      reset.method = expense.method
      reset.inflow = expense.inflow
      reset.outflow = expense.outflow
      this.expenseRepository.replaceById(id, reset)
    });
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


  @get('/expenses/download-csv', {
    responses: {
      '200': {
        description: 'Sends CSV file with expenses records.',
        content: {
          'text/csv': {},
        },
      },
    },
  })
  async downloadCsv(
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<Response> {

    await this.jsonToCsvService.expenses().then((filePath: string | null) => {
      if (filePath !== null) {

        const fileName = this.jsonToCsvService.expensesFileName
        const file = path.resolve(filePath);

        if (!file.startsWith(this.jsonToCsvService.csvBoxPath)) {
          throw new HttpErrors.BadRequest(`Invalid file name: ${fileName}`);
        }

        let rs = fs.createReadStream(filePath);
        response.attachment(fileName);
        rs.pipe(response);

      }
    })

    return response;

  }

}
