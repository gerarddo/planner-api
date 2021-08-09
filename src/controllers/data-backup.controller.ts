// Uncomment these imports to begin using these cool features!

import {inject} from '@loopback/context';
import {get} from '@loopback/rest';
import {DataBackupService} from '../services'; // import {inject} from '@loopback/core';


export class DataBackupController {
  constructor(
    @inject('services.DataBackupService') private backupService: DataBackupService,
  ) { }


  @get('/data-backup', {
    responses: {
      '200': {
        description: 'GET /isabel-sc success',
        content: {
          'application/json': {
            schema: {
              type: "array",
              items: {
                type: "string"
              }
            },
          },
        },
      }
    },
  }
  )
  runDataBackup(): void {

    this.backupService.run()

  }




}
