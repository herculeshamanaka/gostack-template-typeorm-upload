import { EntityRepository, Repository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    // TODO
    const transactionsRepository = getRepository(Transaction);
    const transactions = await transactionsRepository.find();

    const income = transactions
      .filter(trans => trans.type === 'income')
      .reduce((accum, trans) => {
        return accum + trans.value * 1;
      }, 0);

    const outcome = transactions
      .filter(trans => trans.type === 'outcome')
      .reduce((accum, trans) => {
        return accum + trans.value * 1;
      }, 0);

    const total = income - outcome;

    return { income, outcome, total };
  }
}

export default TransactionsRepository;
