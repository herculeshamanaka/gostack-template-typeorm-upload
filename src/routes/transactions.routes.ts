import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';
import importTransactionsConfig from '../config/importTransaction';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';
import AppError from '../errors/AppError';

const transactionsRouter = Router();
const importTransactionsFile = multer(importTransactionsConfig);

transactionsRouter.get('/', async (request, response) => {
  // TODO
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const transactions = await transactionsRepository.find({
    relations: ['category'],
  });

  const balance = await transactionsRepository.getBalance();

  return response.json({
    transactions,
    balance,
  });
});

transactionsRouter.post('/', async (request, response) => {
  // TODO
  const { title, value, type, category } = request.body;
  const createTransaction = new CreateTransactionService();

  const newTransaction = await createTransaction.execute({
    title,
    value,
    type,
    category,
  });

  return response.json(newTransaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  // TODO
  const { id } = request.params;
  const deleteTransaction = new DeleteTransactionService();

  await deleteTransaction.execute(id);

  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  importTransactionsFile.single('file'),
  async (request, response) => {
    // TODO
    if (request.file) {
      const importTransactions = new ImportTransactionsService();
      const transactionsImported = await importTransactions.execute(
        request.file.filename,
      );

      return response.json(transactionsImported);
    }

    throw new AppError('Transactions file not found!');
  },
);

export default transactionsRouter;
