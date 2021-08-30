import {inject} from '@loopback/core';
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
  HttpErrors,
  param,
  patch,
  post,
  requestBody,
  RestBindings
} from '@loopback/rest';
import {Response} from 'express';
import * as fs from 'fs';
import path from 'path';
import {
  Entry,
  Expense
} from '../models';
import {EntryRepository} from '../repositories';
import {JsonToCsvService} from '../services';

// const readdir = promisify(fs.readdir);

const SANDBOX = path.resolve(__dirname, '../../data');


export class EntryExpenseController {
  constructor(
    @repository(EntryRepository) protected entryRepository: EntryRepository,
    @inject('services.JsonToCsvService') private jsonToCsvService: JsonToCsvService,
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



  @get('/expenses/download-data', {
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
    const filePath = this.jsonToCsvService.expenses()
    const fileName = this.jsonToCsvService.expensesFileName
    const file = path.resolve(filePath);

    if (!file.startsWith(this.jsonToCsvService.csvBoxPath)) {
      throw new HttpErrors.BadRequest(`Invalid file name: ${fileName}`);
    }

    let rs = fs.createReadStream(filePath);
    response.attachment(fileName);
    rs.pipe(response);

    return response;
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

