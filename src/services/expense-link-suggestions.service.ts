import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {Entry} from '../models';

@injectable({scope: BindingScope.TRANSIENT})
export class ExpenseLinkSuggestionsService {
  constructor(/* Add @inject to inject parameters */) { }

  /*
   * Add service methods here
   */
  async getSuggestionsById(id: string): Promise<Entry[]> {
    let suggestions: Entry[] = []
    return suggestions
  }
}
