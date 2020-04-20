import { getRepository } from 'typeorm';

import Transaction from '../models/Transaction';

import AppError from '../errors/AppError';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    // TODO
    const transactionsRepository = getRepository(Transaction);
    const transactionToDelete = await transactionsRepository.findOne(id);

    if (!transactionToDelete) {
      throw new AppError('Transaction not found!', 400);
    }

    await transactionsRepository.delete(id);
  }
}

export default DeleteTransactionService;
