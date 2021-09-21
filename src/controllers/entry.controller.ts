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
import {EntryRepository} from '../repositories';
import {EntryLinkSuggestionsService, JsonToCsvService} from '../services';

type MonthOptions = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;


export class EntryController {
  constructor(
    @repository(EntryRepository) public entryRepository: EntryRepository,
    @inject('services.JsonToCsvService') private jsonToCsvService: JsonToCsvService,
    @inject('services.EntryLinkSuggestionsService') private entryLinkSuggestionsService: EntryLinkSuggestionsService,
  ) { }

  @post('/entries', {
    responses: {
      '200': {
        description: 'Entry model instance',
        content: {'application/json': {schema: getModelSchemaRef(Entry)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Entry, {
            title: 'NewEntry',
            exclude: ['id'],
          }),
        },
      },
    })
    entry: Omit<Entry, 'id'>,
  ): Promise<Entry> {
    return this.entryRepository.create(entry);
  }

  @post('/entries/multiple', {
    responses: {
      '200': {
        description: 'Entry model instance',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Entry, {includeRelations: true}),
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
            items: getModelSchemaRef(Entry, {
              title: 'NewEntry',
              exclude: ['id'],
            })
          }
        },
      },
    })
    entries: Omit<Entry, 'id'>[],
  ): Promise<Entry[]> {
    return this.entryRepository.createAll(entries);
  }

  @get('/entries/count', {
    responses: {
      '200': {
        description: 'Entry model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(Entry) where?: Where<Entry>,
  ): Promise<Count> {
    return this.entryRepository.count(where);
  }

  @get('/entries', {
    responses: {
      '200': {
        description: 'Array of Entry model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Entry, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.query.number('year') year?: number,
    @param.query.number('month') month?: MonthOptions,
    @param.filter(Entry) filter?: Filter<Entry>,
  ): Promise<Entry[]> {

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
      "include": [{"relation": "expenses"}],
      'order': ['ymd DESC'],
      'where': {
        'and': [
          {'ymd': {'gt': new Date(sYear + '-' + sMonth + '-01T00:00:00.000Z')}},
          {'ymd': {'lt': new Date(sYear + '-' + sMonth + '-31T00:00:00.000Z')}}
        ]
      }
    }

    return this.entryRepository.find(filter);
  }

  @patch('/entries', {
    responses: {
      '200': {
        description: 'Entry PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Entry, {partial: true}),
        },
      },
    })
    entry: Entry,
    @param.where(Entry) where?: Where<Entry>,
  ): Promise<Count> {
    return this.entryRepository.updateAll(entry, where);
  }

  @get('/entries/{id}', {
    responses: {
      '200': {
        description: 'Entry model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Entry, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.query.boolean('flat') flat: boolean = false,
    @param.path.string('id') id: string,
    @param.filter(Entry, {exclude: 'where'}) filter?: FilterExcludingWhere<Entry>
  ): Promise<Entry> {
    if (flat) {
      filter = {}
    } else {
      filter = {"include": [{"relation": "expenses"}]}
    }
    return this.entryRepository.findById(id, filter);
  }

  @get('/entries/{id}/link-suggestions', {
    responses: {
      '200': {
        description: 'Expense model array instance',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                schema: getModelSchemaRef(Expense, {includeRelations: true}),
              },
            },
          },
        },
      },
    },
  })
  async findSuggestionsById(
    @param.path.string('id') id: string
  ): Promise<Expense[]> {

    return []
  }

  @patch('/entries/{id}', {
    responses: {
      '204': {
        description: 'Entry PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Entry, {partial: true}),
        },
      },
    })
    entry: Entry,
  ): Promise<void> {
    await this.entryRepository.updateById(id, entry);
  }

  @put('/entries/{id}', {
    responses: {
      '204': {
        description: 'Entry PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() entry: Entry,
  ): Promise<void> {
    await this.entryRepository.replaceById(id, entry);
  }


  @patch('/entries/{id}/tags', {
    responses: {
      '204': {
        description: 'Entry PATCH success',
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
    await this.entryRepository.updateById(id, {tags: tags});
  }


  @del('/entries/{id}', {
    responses: {
      '204': {
        description: 'Entry DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.entryRepository.deleteById(id);
  }

  @get('/entries/download-data', {
    responses: {
      '200': {
        description: 'Sends CSV file with entries records.',
        content: {
          'text/csv': {},
        },
      },
    },
  })
  async downloadCsv(
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<Response> {

    await this.jsonToCsvService.entries().then((filePath: string | null) => {
      if (filePath !== null) {

        const fileName = this.jsonToCsvService.entriesFileName
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
