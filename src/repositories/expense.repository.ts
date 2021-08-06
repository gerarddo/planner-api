import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {Expense, ExpenseRelations, Entry} from '../models';
import {DbDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {EntryRepository} from './entry.repository';

export class ExpenseRepository extends DefaultCrudRepository<
  Expense,
  typeof Expense.prototype.id,
  ExpenseRelations
> {

  public readonly entry: BelongsToAccessor<Entry, typeof Expense.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('EntryRepository') protected entryRepositoryGetter: Getter<EntryRepository>,
  ) {
    super(Expense, dataSource);
    this.entry = this.createBelongsToAccessorFor('entry', entryRepositoryGetter,);
    this.registerInclusionResolver('entry', this.entry.inclusionResolver);
  }
}
