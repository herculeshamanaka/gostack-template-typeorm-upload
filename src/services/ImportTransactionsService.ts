import path from 'path';
import fs from 'fs';
import csvParse from 'csv-parse';
import { getRepository, In, getCustomRepository } from 'typeorm';

import TransactionRepository from '../repositories/TransactionsRepository';
import importTransactionsConfig from '../config/importTransaction';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface TransactionRequestDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}
class ImportTransactionsService {
  async execute(importFilename: string): Promise<Transaction[]> {
    // defining file path
    const csvFilePath = path.join(
      importTransactionsConfig.importDir,
      importFilename,
    );

    const transactionsRepository = getCustomRepository(TransactionRepository);
    const categoriesRepository = getRepository(Category);

    // checking if the csvfile exists
    const fileRows: TransactionRequestDTO[] = [];
    const fileCategories: string[] = [];

    // reading file lines, storing file rows and categories
    const parsedCsvFile = fs
      .createReadStream(csvFilePath)
      .pipe(csvParse({ ltrim: true, from_line: 2 }))
      .on('data', fileRow => {
        const [title, type, value, category] = fileRow.map((cell: string) =>
          cell.trim(),
        );

        if (!title || !type || !value || !category)
          throw new AppError(
            'CSV file has a wrong format. Please use the colums title, type, value and category.',
            400,
          );

        fileCategories.push(category);
        fileRows.push({ title, type, value, category });
      });

    // creating promise to wait until file is read
    await new Promise(resolve => parsedCsvFile.on('end', resolve));

    // get existing categories
    const existingCategoriesTitles = await categoriesRepository.find({
      where: { title: In(fileCategories) },
    });

    // checking titles that dont exists and removing duplicates
    const addNewCategories = fileCategories
      .filter(
        category =>
          !existingCategoriesTitles
            .map((categories: Category) => categories.title)
            .includes(category),
      )
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addNewCategories.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const allCategories = [...newCategories, ...existingCategoriesTitles];

    const createdTransactions = transactionsRepository.create(
      fileRows.map(rows => ({
        title: rows.title,
        type: rows.type,
        value: rows.value,
        category: allCategories.find(
          category => category.title === rows.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    await fs.promises.unlink(csvFilePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
