import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {Entry, EntryRelations, Expense} from '../models';
import {DbDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {ExpenseRepository} from './expense.repository';

export class EntryRepository extends DefaultCrudRepository<
  Entry,
  typeof Entry.prototype.id,
  EntryRelations
> {

  public readonly expenses: HasManyRepositoryFactory<Expense, typeof Entry.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ExpenseRepository') protected expenseRepositoryGetter: Getter<ExpenseRepository>,
  ) {
    super(Entry, dataSource);
    this.expenses = this.createHasManyRepositoryFactoryFor('expenses', expenseRepositoryGetter,);
    this.registerInclusionResolver('expenses', this.expenses.inclusionResolver);
  }
}
