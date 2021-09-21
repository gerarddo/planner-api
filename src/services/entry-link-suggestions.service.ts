import { /* inject, */ BindingScope, injectable} from '@loopback/core';
@injectable({scope: BindingScope.TRANSIENT})
export class EntryLinkSuggestionsService {
  constructor(/* Add @inject to inject parameters */) { }

  /*
   * Add service methods here
   */

  // async getSuggestionsById(id: string): Promise<Expense[]> {
  //   let suggestions: Expense[] = []
  //   return suggestions
  // }
}
