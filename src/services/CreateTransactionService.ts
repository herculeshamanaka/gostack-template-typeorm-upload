import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface RequestDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: RequestDTO): Promise<Transaction> {
    // TODO
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);
    let category_id = '';

    // Checking if there is enough balance
    if (type === 'outcome') {
      const balance = await transactionsRepository.getBalance();
      if (value > balance.total) {
        throw new AppError(
          'There is not enough balance for this transaction!',
          400,
        );
      }
    }

    // Checking if the category already exists on DB
    const categoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    // If not, let's create it!
    if (!categoryExists) {
      const newCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(newCategory);
      category_id = newCategory.id;
    } else {
      category_id = categoryExists.id;
    }

    const newTransaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionsRepository.save(newTransaction);

    return newTransaction;
  }
}

export default CreateTransactionService;
