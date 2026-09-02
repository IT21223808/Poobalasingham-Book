import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository, SelectQueryBuilder } from 'typeorm';

import { ExpenseCategory } from './entities/expense-category.entity';
import {
  FinancePaymentMethod,
  FinanceTransaction,
  TransactionType,
} from './entities/finance-transaction.entity';
import { SupplierPayment } from './entities/supplier-payment.entity';
import { CustomerPayment } from './entities/customer-payment.entity';
import {
  PurchaseInvoice,
  PurchaseInvoiceStatus,
} from '../purchasing/entities/purchase-invoice.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { Customer } from '../customers/entities/customer.entity';
import { PosSale } from '../pos/entities/pos-sale.entity';
import { Product } from '../products/entities/product.entity';

import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
import { CreateFinanceTransactionDto } from './dto/create-finance-transaction.dto';
import { UpdateFinanceTransactionDto } from './dto/update-finance-transaction.dto';
import { CreateIncomeDto } from './dto/create-income.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';
import { CreateCustomerPaymentDto } from './dto/create-customer-payment.dto';
import { FinanceQueryDto } from './dto/finance-query.dto';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(ExpenseCategory)
    private readonly expenseCategoryRepo: Repository<ExpenseCategory>,

    @InjectRepository(FinanceTransaction)
    private readonly transactionRepo: Repository<FinanceTransaction>,

    @InjectRepository(SupplierPayment)
    private readonly supplierPaymentRepo: Repository<SupplierPayment>,

    @InjectRepository(CustomerPayment)
    private readonly customerPaymentRepo: Repository<CustomerPayment>,

    @InjectRepository(PurchaseInvoice)
    private readonly purchaseInvoiceRepo: Repository<PurchaseInvoice>,

    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,

    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,

    @InjectRepository(PosSale)
    private readonly posSaleRepo: Repository<PosSale>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    private readonly dataSource: DataSource,
  ) {}

  // =========================================================
  // HELPER: DATE RANGE GENERATOR
  // =========================================================
  private getDateRangeFromPeriod(period?: string, startDate?: string, endDate?: string) {
    if (startDate && endDate) {
      return { start: startDate, end: endDate };
    }
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (period === 'today') {
      return { start: todayStr, end: todayStr };
    }
    if (period === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      return {
        start: monday.toISOString().slice(0, 10),
        end: todayStr,
      };
    }
    if (period === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        start: firstDay.toISOString().slice(0, 10),
        end: todayStr,
      };
    }
    if (period === 'year') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      return {
        start: firstDay.toISOString().slice(0, 10),
        end: todayStr,
      };
    }

    return { start: startDate || undefined, end: endDate || undefined };
  }

  // =========================================================
  // HELPER: NUMBER GENERATORS
  // =========================================================
  private async generateTransactionNumber(managerOrRepo: any): Promise<string> {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `TXN-${todayStr}-`;
    const repo = managerOrRepo.getRepository ? managerOrRepo.getRepository(FinanceTransaction) : managerOrRepo;
    const count = await repo.count();
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  private async generateSupplierPaymentNumber(managerOrRepo: any): Promise<string> {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `SPAY-${todayStr}-`;
    const repo = managerOrRepo.getRepository ? managerOrRepo.getRepository(SupplierPayment) : managerOrRepo;
    const count = await repo.count();
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  private async generateCustomerPaymentNumber(managerOrRepo: any): Promise<string> {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `CPAY-${todayStr}-`;
    const repo = managerOrRepo.getRepository ? managerOrRepo.getRepository(CustomerPayment) : managerOrRepo;
    const count = await repo.count();
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  // =========================================================
  // 1. EXPENSE CATEGORIES
  // =========================================================

  async createExpenseCategory(dto: CreateExpenseCategoryDto): Promise<ExpenseCategory> {
    const existing = await this.expenseCategoryRepo.findOne({
      where: { name: dto.name.trim() },
    });
    if (existing) {
      throw new ConflictException(`Expense category "${dto.name}" already exists`);
    }

    const category = this.expenseCategoryRepo.create({
      name: dto.name.trim(),
      description: dto.description?.trim() || undefined,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return await this.expenseCategoryRepo.save(category);
  }

  async findAllExpenseCategories(search?: string, status?: string): Promise<ExpenseCategory[]> {
    const qb = this.expenseCategoryRepo.createQueryBuilder('c');

    if (search && search.trim()) {
      qb.where('(LOWER(c.name) LIKE LOWER(:search) OR LOWER(c.description) LIKE LOWER(:search))', {
        search: `%${search.trim()}%`,
      });
    }

    if (status) {
      if (status.toUpperCase() === 'ACTIVE') {
        qb.andWhere('c.isActive = :active', { active: true });
      } else if (status.toUpperCase() === 'INACTIVE') {
        qb.andWhere('c.isActive = :active', { active: false });
      }
    }

    qb.orderBy('c.name', 'ASC');
    return await qb.getMany();
  }

  async findOneExpenseCategory(id: number): Promise<ExpenseCategory> {
    const category = await this.expenseCategoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Expense category with ID ${id} not found`);
    }
    return category;
  }

  async updateExpenseCategory(id: number, dto: UpdateExpenseCategoryDto): Promise<ExpenseCategory> {
    const category = await this.findOneExpenseCategory(id);

    if (dto.name && dto.name.trim() !== category.name) {
      const existing = await this.expenseCategoryRepo.findOne({
        where: { name: dto.name.trim() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Expense category "${dto.name}" already exists`);
      }
      category.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      category.description = dto.description?.trim() || undefined;
    }

    if (dto.isActive !== undefined) {
      category.isActive = dto.isActive;
    }

    return await this.expenseCategoryRepo.save(category);
  }

  async deleteExpenseCategory(id: number): Promise<{ success: boolean; message: string }> {
    const category = await this.findOneExpenseCategory(id);

    // Check if category is used in finance transactions
    const count = await this.transactionRepo.count({
      where: { category: category.name },
    });

    if (count > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" because it is currently referenced by ${count} finance transaction(s). You may deactivate it instead.`,
      );
    }

    await this.expenseCategoryRepo.remove(category);
    return { success: true, message: `Category "${category.name}" deleted successfully.` };
  }

  // =========================================================
  // 2. CENTRAL FINANCE TRANSACTIONS
  // =========================================================

  async createTransaction(dto: CreateFinanceTransactionDto): Promise<FinanceTransaction> {
    if (dto.amount <= 0) {
      throw new BadRequestException('Transaction amount must be greater than 0');
    }

    const transactionNumber = await this.generateTransactionNumber(this.transactionRepo);
    const date = dto.transactionDate || new Date().toISOString().slice(0, 10);

    const transaction = this.transactionRepo.create({
      transactionNumber,
      transactionDate: date,
      type: dto.type,
      paymentMethod: dto.paymentMethod,
      category: dto.category.trim(),
      description: dto.description.trim(),
      amount: Number(dto.amount),
      reference: dto.reference?.trim() || null,
      customerId: dto.customerId || null,
      supplierId: dto.supplierId || null,
      purchaseInvoiceId: dto.purchaseInvoiceId || null,
    });

    return await this.transactionRepo.save(transaction);
  }

  async findAllTransactions(query?: FinanceQueryDto) {
    const qb = this.transactionRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.customer', 'customer')
      .leftJoinAndSelect('t.supplier', 'supplier')
      .leftJoinAndSelect('t.purchaseInvoice', 'purchaseInvoice');

    if (query?.type) {
      qb.andWhere('t.type = :type', { type: query.type });
    }

    if (query?.paymentMethod) {
      qb.andWhere('t.paymentMethod = :paymentMethod', { paymentMethod: query.paymentMethod });
    }

    if (query?.category && query.category.trim()) {
      qb.andWhere('t.category = :category', { category: query.category.trim() });
    }

    const range = this.getDateRangeFromPeriod(query?.period, query?.startDate, query?.endDate);
    if (range.start) {
      qb.andWhere('t.transactionDate >= :start', { start: range.start });
    }
    if (range.end) {
      qb.andWhere('t.transactionDate <= :end', { end: range.end });
    }

    if (query?.search && query.search.trim()) {
      qb.andWhere(
        '(LOWER(t.transactionNumber) LIKE LOWER(:s) OR LOWER(t.description) LIKE LOWER(:s) OR LOWER(t.category) LIKE LOWER(:s) OR LOWER(t.reference) LIKE LOWER(:s))',
        { s: `%${query.search.trim()}%` },
      );
    }

    qb.orderBy('t.transactionDate', 'DESC').addOrderBy('t.id', 'DESC');

    const transactions = await qb.getMany();

    // Summary calculations
    let totalIncome = 0;
    let totalExpense = 0;
    let totalCash = 0;
    let totalBank = 0;

    for (const t of transactions) {
      const amt = Number(t.amount || 0);
      if (t.type === TransactionType.INCOME) {
        totalIncome += amt;
        if (t.paymentMethod === FinancePaymentMethod.CASH) totalCash += amt;
        else if (t.paymentMethod === FinancePaymentMethod.BANK) totalBank += amt;
      } else if (t.type === TransactionType.EXPENSE) {
        totalExpense += amt;
        if (t.paymentMethod === FinancePaymentMethod.CASH) totalCash -= amt;
        else if (t.paymentMethod === FinancePaymentMethod.BANK) totalBank -= amt;
      }
    }

    return {
      transactions,
      summary: {
        totalIncome: Number(totalIncome.toFixed(2)),
        totalExpense: Number(totalExpense.toFixed(2)),
        netAmount: Number((totalIncome - totalExpense).toFixed(2)),
        totalCash: Number(totalCash.toFixed(2)),
        totalBank: Number(totalBank.toFixed(2)),
        count: transactions.length,
      },
    };
  }

  async findOneTransaction(id: number): Promise<FinanceTransaction> {
    const txn = await this.transactionRepo.findOne({
      where: { id },
      relations: {
        customer: true,
        supplier: true,
        purchaseInvoice: true,
      },
    });

    if (!txn) {
      throw new NotFoundException(`Finance transaction with ID ${id} not found`);
    }
    return txn;
  }

  async updateTransaction(id: number, dto: UpdateFinanceTransactionDto): Promise<FinanceTransaction> {
    const txn = await this.findOneTransaction(id);

    if (dto.transactionDate) txn.transactionDate = dto.transactionDate;
    if (dto.type) txn.type = dto.type;
    if (dto.paymentMethod) txn.paymentMethod = dto.paymentMethod;
    if (dto.category) txn.category = dto.category.trim();
    if (dto.description) txn.description = dto.description.trim();
    if (dto.amount !== undefined) {
      if (dto.amount <= 0) throw new BadRequestException('Amount must be greater than 0');
      txn.amount = Number(dto.amount);
    }
    if (dto.reference !== undefined) txn.reference = dto.reference ? dto.reference.trim() : null;
    if (dto.customerId !== undefined) txn.customerId = dto.customerId || null;
    if (dto.supplierId !== undefined) txn.supplierId = dto.supplierId || null;
    if (dto.purchaseInvoiceId !== undefined) txn.purchaseInvoiceId = dto.purchaseInvoiceId || null;

    return await this.transactionRepo.save(txn);
  }

  async deleteTransaction(id: number): Promise<{ success: boolean; message: string }> {
    const txn = await this.findOneTransaction(id);
    await this.transactionRepo.remove(txn);
    return { success: true, message: `Transaction #${txn.transactionNumber} deleted successfully.` };
  }

  // =========================================================
  // 3. CASH BOOK & BANK BOOK
  // =========================================================

  async getCashBook(query?: FinanceQueryDto) {
    const qb = this.transactionRepo
      .createQueryBuilder('t')
      .where('t.paymentMethod = :method', { method: FinancePaymentMethod.CASH });

    const range = this.getDateRangeFromPeriod(query?.period, query?.startDate, query?.endDate);

    // Calculate opening balance before startDate if filtered
    let openingBalance = 0;
    if (range.start) {
      const priorTxns = await this.transactionRepo
        .createQueryBuilder('t')
        .where('t.paymentMethod = :method', { method: FinancePaymentMethod.CASH })
        .andWhere('t.transactionDate < :start', { start: range.start })
        .getMany();

      for (const pt of priorTxns) {
        const amt = Number(pt.amount || 0);
        if (pt.type === TransactionType.INCOME) openingBalance += amt;
        else if (pt.type === TransactionType.EXPENSE) openingBalance -= amt;
      }
      qb.andWhere('t.transactionDate >= :start', { start: range.start });
    }

    if (range.end) {
      qb.andWhere('t.transactionDate <= :end', { end: range.end });
    }

    if (query?.search && query.search.trim()) {
      qb.andWhere(
        '(LOWER(t.transactionNumber) LIKE LOWER(:s) OR LOWER(t.description) LIKE LOWER(:s) OR LOWER(t.category) LIKE LOWER(:s) OR LOWER(t.reference) LIKE LOWER(:s))',
        { s: `%${query.search.trim()}%` },
      );
    }

    qb.orderBy('t.transactionDate', 'ASC').addOrderBy('t.id', 'ASC');

    const rawTxns = await qb.getMany();

    let runningBalance = openingBalance;
    let totalCashIn = 0;
    let totalCashOut = 0;

    const entries = rawTxns.map((t) => {
      const amt = Number(t.amount || 0);
      const isIncome = t.type === TransactionType.INCOME;
      const cashIn = isIncome ? amt : 0;
      const cashOut = !isIncome ? amt : 0;

      if (isIncome) {
        runningBalance += amt;
        totalCashIn += amt;
      } else {
        runningBalance -= amt;
        totalCashOut += amt;
      }

      return {
        id: t.id,
        transactionNumber: t.transactionNumber,
        date: t.transactionDate,
        type: t.type,
        category: t.category,
        description: t.description,
        reference: t.reference,
        cashIn: Number(cashIn.toFixed(2)),
        cashOut: Number(cashOut.toFixed(2)),
        balance: Number(runningBalance.toFixed(2)),
      };
    });

    return {
      openingBalance: Number(openingBalance.toFixed(2)),
      totalCashIn: Number(totalCashIn.toFixed(2)),
      totalCashOut: Number(totalCashOut.toFixed(2)),
      closingBalance: Number(runningBalance.toFixed(2)),
      count: entries.length,
      entries: entries.reverse(), // most recent first for display
    };
  }

  async getBankBook(query?: FinanceQueryDto) {
    const qb = this.transactionRepo
      .createQueryBuilder('t')
      .where('t.paymentMethod = :method', { method: FinancePaymentMethod.BANK });

    const range = this.getDateRangeFromPeriod(query?.period, query?.startDate, query?.endDate);

    let openingBalance = 0;
    if (range.start) {
      const priorTxns = await this.transactionRepo
        .createQueryBuilder('t')
        .where('t.paymentMethod = :method', { method: FinancePaymentMethod.BANK })
        .andWhere('t.transactionDate < :start', { start: range.start })
        .getMany();

      for (const pt of priorTxns) {
        const amt = Number(pt.amount || 0);
        if (pt.type === TransactionType.INCOME) openingBalance += amt;
        else if (pt.type === TransactionType.EXPENSE) openingBalance -= amt;
      }
      qb.andWhere('t.transactionDate >= :start', { start: range.start });
    }

    if (range.end) {
      qb.andWhere('t.transactionDate <= :end', { end: range.end });
    }

    if (query?.search && query.search.trim()) {
      qb.andWhere(
        '(LOWER(t.transactionNumber) LIKE LOWER(:s) OR LOWER(t.description) LIKE LOWER(:s) OR LOWER(t.category) LIKE LOWER(:s) OR LOWER(t.reference) LIKE LOWER(:s))',
        { s: `%${query.search.trim()}%` },
      );
    }

    qb.orderBy('t.transactionDate', 'ASC').addOrderBy('t.id', 'ASC');

    const rawTxns = await qb.getMany();

    let runningBalance = openingBalance;
    let totalBankIn = 0;
    let totalBankOut = 0;

    const entries = rawTxns.map((t) => {
      const amt = Number(t.amount || 0);
      const isIncome = t.type === TransactionType.INCOME;
      const bankIn = isIncome ? amt : 0;
      const bankOut = !isIncome ? amt : 0;

      if (isIncome) {
        runningBalance += amt;
        totalBankIn += amt;
      } else {
        runningBalance -= amt;
        totalBankOut += amt;
      }

      return {
        id: t.id,
        transactionNumber: t.transactionNumber,
        date: t.transactionDate,
        type: t.type,
        category: t.category,
        description: t.description,
        reference: t.reference,
        bankIn: Number(bankIn.toFixed(2)),
        bankOut: Number(bankOut.toFixed(2)),
        balance: Number(runningBalance.toFixed(2)),
      };
    });

    return {
      openingBalance: Number(openingBalance.toFixed(2)),
      totalBankIn: Number(totalBankIn.toFixed(2)),
      totalBankOut: Number(totalBankOut.toFixed(2)),
      closingBalance: Number(runningBalance.toFixed(2)),
      count: entries.length,
      entries: entries.reverse(),
    };
  }

  // =========================================================
  // 4. INCOME
  // =========================================================

  async createIncome(dto: CreateIncomeDto): Promise<FinanceTransaction> {
    return await this.createTransaction({
      transactionDate: dto.date,
      type: TransactionType.INCOME,
      paymentMethod: dto.paymentMethod,
      category: dto.category,
      description: dto.description,
      amount: dto.amount,
      reference: dto.reference,
      customerId: dto.customerId,
    });
  }

  async findAllIncome(query?: FinanceQueryDto) {
    return await this.findAllTransactions({
      ...query,
      type: TransactionType.INCOME,
    });
  }

  // =========================================================
  // 5. EXPENSES
  // =========================================================

  async createExpense(dto: CreateExpenseDto): Promise<FinanceTransaction> {
    return await this.createTransaction({
      transactionDate: dto.date,
      type: TransactionType.EXPENSE,
      paymentMethod: dto.paymentMethod,
      category: dto.expenseCategory,
      description: dto.description,
      amount: dto.amount,
      reference: dto.reference,
      supplierId: dto.supplierId,
      purchaseInvoiceId: dto.purchaseInvoiceId,
    });
  }

  async findAllExpenses(query?: FinanceQueryDto) {
    return await this.findAllTransactions({
      ...query,
      type: TransactionType.EXPENSE,
    });
  }

  // =========================================================
  // 6. SUPPLIER PAYMENTS (WITH ATOMIC TRANSACTION)
  // =========================================================

  async createSupplierPayment(dto: CreateSupplierPaymentDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Check Supplier
      const supplier = await queryRunner.manager.findOne(Supplier, {
        where: { id: dto.supplierId },
      });
      if (!supplier) {
        throw new NotFoundException(`Supplier with ID ${dto.supplierId} not found`);
      }

      // 2. Check Purchase Invoice
      const invoice = await queryRunner.manager.findOne(PurchaseInvoice, {
        where: { id: dto.purchaseInvoiceId },
      });
      if (!invoice) {
        throw new NotFoundException(`Purchase Invoice with ID ${dto.purchaseInvoiceId} not found`);
      }

      if (invoice.supplierId !== supplier.id) {
        throw new BadRequestException('Invoice supplier does not match the provided supplier');
      }

      if (invoice.paymentStatus === PurchaseInvoiceStatus.CANCELLED) {
        throw new BadRequestException('Cannot make payments on a cancelled invoice');
      }

      if (invoice.paymentStatus === PurchaseInvoiceStatus.PAID) {
        throw new BadRequestException('This invoice is already fully paid');
      }

      // 3. Calculate previous payments
      const previousPayments = await queryRunner.manager.find(SupplierPayment, {
        where: { purchaseInvoiceId: invoice.id },
      });

      const alreadyPaid = previousPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const grandTotal = Number(invoice.grandTotal || 0);
      const outstanding = Number((grandTotal - alreadyPaid).toFixed(2));

      if (Number(dto.amount) > outstanding + 0.01) {
        throw new BadRequestException(
          `Payment amount (${dto.amount}) exceeds outstanding balance (${outstanding.toFixed(2)})`,
        );
      }

      // 4. Generate payment and transaction numbers
      const paymentNumber = await this.generateSupplierPaymentNumber(queryRunner);
      const paymentDate = dto.paymentDate || new Date().toISOString().slice(0, 10);

      // 5. Create Supplier Payment record
      const payment = queryRunner.manager.create(SupplierPayment, {
        paymentNumber,
        supplierId: supplier.id,
        purchaseInvoiceId: invoice.id,
        paymentDate,
        amount: Number(dto.amount),
        paymentMethod: dto.paymentMethod,
        reference: dto.reference || null,
        notes: dto.notes || null,
      });

      const savedPayment = await queryRunner.manager.save(SupplierPayment, payment);

      // 6. Create Finance Transaction
      const transactionNumber = await this.generateTransactionNumber(queryRunner);
      const financeTxn = queryRunner.manager.create(FinanceTransaction, {
        transactionNumber,
        transactionDate: paymentDate,
        type: TransactionType.EXPENSE,
        paymentMethod: dto.paymentMethod,
        category: 'Supplier Payment',
        description: `Payment for Purchase Invoice #${invoice.invoiceNumber} to ${supplier.supplierName}`,
        amount: Number(dto.amount),
        reference: dto.reference || paymentNumber,
        supplierId: supplier.id,
        purchaseInvoiceId: invoice.id,
      });

      await queryRunner.manager.save(FinanceTransaction, financeTxn);

      // 7. Update Invoice Payment Status
      const newPaidTotal = alreadyPaid + Number(dto.amount);
      let newStatus: PurchaseInvoiceStatus;

      if (newPaidTotal >= grandTotal - 0.01) {
        newStatus = PurchaseInvoiceStatus.PAID;
      } else if (newPaidTotal > 0) {
        newStatus = PurchaseInvoiceStatus.PARTIALLY_PAID;
      } else {
        newStatus = PurchaseInvoiceStatus.UNPAID;
      }

      invoice.paymentStatus = newStatus;
      await queryRunner.manager.save(PurchaseInvoice, invoice);

      // Commit transaction
      await queryRunner.commitTransaction();

      return {
        payment: savedPayment,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        grandTotal,
        totalPaid: Number(newPaidTotal.toFixed(2)),
        outstanding: Number(Math.max(0, grandTotal - newPaidTotal).toFixed(2)),
        paymentStatus: newStatus,
        transactionNumber,
      };
    } catch (err) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllSupplierPayments(query?: { supplierId?: number; purchaseInvoiceId?: number; search?: string }) {
    const qb = this.supplierPaymentRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.supplier', 'supplier')
      .leftJoinAndSelect('p.purchaseInvoice', 'invoice');

    if (query?.supplierId) {
      qb.andWhere('p.supplierId = :supplierId', { supplierId: query.supplierId });
    }

    if (query?.purchaseInvoiceId) {
      qb.andWhere('p.purchaseInvoiceId = :invoiceId', { invoiceId: query.purchaseInvoiceId });
    }

    if (query?.search && query.search.trim()) {
      qb.andWhere(
        '(LOWER(p.paymentNumber) LIKE LOWER(:s) OR LOWER(p.reference) LIKE LOWER(:s) OR LOWER(supplier.supplierName) LIKE LOWER(:s) OR LOWER(invoice.invoiceNumber) LIKE LOWER(:s))',
        { s: `%${query.search.trim()}%` },
      );
    }

    qb.orderBy('p.paymentDate', 'DESC').addOrderBy('p.id', 'DESC');
    return await qb.getMany();
  }

  async findOneSupplierPayment(id: number): Promise<SupplierPayment> {
    const payment = await this.supplierPaymentRepo.findOne({
      where: { id },
      relations: {
        supplier: true,
        purchaseInvoice: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Supplier payment with ID ${id} not found`);
    }
    return payment;
  }

  // =========================================================
  // 7. CUSTOMER PAYMENTS (WITH ATOMIC TRANSACTION)
  // =========================================================

  async createCustomerPayment(dto: CreateCustomerPaymentDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verify Customer
      const customer = await queryRunner.manager.findOne(Customer, {
        where: { id: dto.customerId },
      });
      if (!customer) {
        throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
      }

      // 2. If POS Sale linked, verify and calculate outstanding
      let posSale: PosSale | null = null;
      if (dto.salesInvoiceId) {
        posSale = await queryRunner.manager.findOne(PosSale, {
          where: { invoiceNumber: dto.salesInvoiceId },
        });
        if (!posSale) {
          // Check by UUID if invoiceNumber not matched directly
          posSale = await queryRunner.manager.findOne(PosSale, {
            where: { id: dto.salesInvoiceId },
          });
        }
      }

      // 3. Generate payment numbers
      const paymentNumber = await this.generateCustomerPaymentNumber(queryRunner);
      const paymentDate = dto.paymentDate || new Date().toISOString().slice(0, 10);

      // 4. Create Customer Payment record
      const payment = queryRunner.manager.create(CustomerPayment, {
        paymentNumber,
        customerId: customer.id,
        salesInvoiceId: posSale ? posSale.invoiceNumber : dto.salesInvoiceId || null,
        paymentDate,
        amount: Number(dto.amount),
        paymentMethod: dto.paymentMethod,
        reference: dto.reference || null,
        notes: dto.notes || null,
      });

      const savedPayment = await queryRunner.manager.save(CustomerPayment, payment);

      // 5. Create Finance Transaction
      const transactionNumber = await this.generateTransactionNumber(queryRunner);
      const financeTxn = queryRunner.manager.create(FinanceTransaction, {
        transactionNumber,
        transactionDate: paymentDate,
        type: TransactionType.INCOME,
        paymentMethod: dto.paymentMethod,
        category: 'Customer Payment',
        description: `Payment received from ${customer.customerName}${dto.salesInvoiceId ? ' for Invoice #' + dto.salesInvoiceId : ''}`,
        amount: Number(dto.amount),
        reference: dto.reference || paymentNumber,
        customerId: customer.id,
      });

      await queryRunner.manager.save(FinanceTransaction, financeTxn);

      await queryRunner.commitTransaction();

      return {
        payment: savedPayment,
        customerName: customer.customerName,
        transactionNumber,
      };
    } catch (err) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllCustomerPayments(query?: { customerId?: number; salesInvoiceId?: string; search?: string }) {
    const qb = this.customerPaymentRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.customer', 'customer')
      .leftJoinAndSelect('p.salesInvoice', 'salesInvoice');

    if (query?.customerId) {
      qb.andWhere('p.customerId = :customerId', { customerId: query.customerId });
    }

    if (query?.salesInvoiceId) {
      qb.andWhere('p.salesInvoiceId = :invoiceId', { invoiceId: query.salesInvoiceId });
    }

    if (query?.search && query.search.trim()) {
      qb.andWhere(
        '(LOWER(p.paymentNumber) LIKE LOWER(:s) OR LOWER(p.reference) LIKE LOWER(:s) OR LOWER(customer.customerName) LIKE LOWER(:s) OR LOWER(p.salesInvoiceId) LIKE LOWER(:s))',
        { s: `%${query.search.trim()}%` },
      );
    }

    qb.orderBy('p.paymentDate', 'DESC').addOrderBy('p.id', 'DESC');
    return await qb.getMany();
  }

  async findOneCustomerPayment(id: number): Promise<CustomerPayment> {
    const payment = await this.customerPaymentRepo.findOne({
      where: { id },
      relations: {
        customer: true,
        salesInvoice: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Customer payment with ID ${id} not found`);
    }
    return payment;
  }

  // =========================================================
  // 8. ACCOUNTS PAYABLE (AP)
  // =========================================================

  async getAccountsPayable(query?: {
    supplierId?: number;
    status?: string;
    search?: string;
    overdueOnly?: boolean;
    startDate?: string;
    endDate?: string;
  }) {
    const qb = this.purchaseInvoiceRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.supplier', 'supplier')
      .where('inv.paymentStatus != :cancelled', { cancelled: PurchaseInvoiceStatus.CANCELLED });

    if (query?.supplierId) {
      qb.andWhere('inv.supplierId = :supplierId', { supplierId: query.supplierId });
    }

    if (query?.startDate) {
      qb.andWhere('inv.invoiceDate >= :startDate', { startDate: query.startDate });
    }
    if (query?.endDate) {
      qb.andWhere('inv.invoiceDate <= :endDate', { endDate: query.endDate });
    }

    if (query?.search && query.search.trim()) {
      qb.andWhere(
        '(LOWER(inv.invoiceNumber) LIKE LOWER(:s) OR LOWER(supplier.supplierName) LIKE LOWER(:s))',
        { s: `%${query.search.trim()}%` },
      );
    }

    qb.orderBy('inv.invoiceDate', 'DESC').addOrderBy('inv.id', 'DESC');

    const invoices = await qb.getMany();

    // Fetch all supplier payments for these invoices
    const invoiceIds = invoices.map((i) => i.id);
    const payments = invoiceIds.length > 0
      ? await this.supplierPaymentRepo.find({
          where: { purchaseInvoiceId: In(invoiceIds) },
          order: { paymentDate: 'DESC' },
        })
      : [];

    const paymentsByInvoice = new Map<number, SupplierPayment[]>();
    for (const p of payments) {
      const list = paymentsByInvoice.get(p.purchaseInvoiceId) || [];
      list.push(p);
      paymentsByInvoice.set(p.purchaseInvoiceId, list);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    let totalInvoiceAmount = 0;
    let totalPaidAmount = 0;
    let totalOutstanding = 0;
    let totalOverdueAmount = 0;
    let overdueCount = 0;

    let records = invoices.map((inv) => {
      const invPayments = paymentsByInvoice.get(inv.id) || [];
      const paidAmount = invPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const grandTotal = Number(inv.grandTotal || 0);
      const outstanding = Number(Math.max(0, grandTotal - paidAmount).toFixed(2));

      const isOverdue = inv.dueDate ? inv.dueDate < todayStr && outstanding > 0 : false;

      totalInvoiceAmount += grandTotal;
      totalPaidAmount += paidAmount;
      totalOutstanding += outstanding;
      if (isOverdue) {
        totalOverdueAmount += outstanding;
        overdueCount++;
      }

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        supplierId: inv.supplierId,
        supplierName: inv.supplier?.supplierName || 'Unknown Supplier',
        supplierCode: inv.supplier?.supplierCode,
        invoiceAmount: grandTotal,
        paidAmount: Number(paidAmount.toFixed(2)),
        outstanding,
        status: inv.paymentStatus,
        isOverdue,
        payments: invPayments,
      };
    });

    // Apply status and overdue filters in-memory
    if (query?.status && query.status.toUpperCase() !== 'ALL') {
      records = records.filter((r) => r.status === query.status);
    }

    if (query?.overdueOnly) {
      records = records.filter((r) => r.isOverdue);
    }

    return {
      summary: {
        totalInvoiceAmount: Number(totalInvoiceAmount.toFixed(2)),
        totalPaidAmount: Number(totalPaidAmount.toFixed(2)),
        totalOutstanding: Number(totalOutstanding.toFixed(2)),
        totalOverdueAmount: Number(totalOverdueAmount.toFixed(2)),
        overdueCount,
        invoiceCount: records.length,
      },
      records,
    };
  }

  // =========================================================
  // 9. ACCOUNTS RECEIVABLE (AR)
  // =========================================================

  async getAccountsReceivable(query?: {
    customerId?: number;
    status?: string;
    search?: string;
    overdueOnly?: boolean;
    startDate?: string;
    endDate?: string;
  }) {
    // Collect customer sales and payments
    const salesQb = this.posSaleRepo.createQueryBuilder('sale');

    if (query?.customerId) {
      salesQb.andWhere('sale.customerId = :customerId', { customerId: query.customerId });
    }
    if (query?.startDate) {
      salesQb.andWhere('sale.createdAt >= :startDate', { startDate: `${query.startDate} 00:00:00` });
    }
    if (query?.endDate) {
      salesQb.andWhere('sale.createdAt <= :endDate', { endDate: `${query.endDate} 23:59:59` });
    }
    if (query?.search && query.search.trim()) {
      salesQb.andWhere(
        '(LOWER(sale.invoiceNumber) LIKE LOWER(:s) OR LOWER(sale.customerName) LIKE LOWER(:s))',
        { s: `%${query.search.trim()}%` },
      );
    }

    salesQb.orderBy('sale.createdAt', 'DESC');
    const sales = await salesQb.getMany();

    // Fetch customer payments
    const customerPayments = await this.customerPaymentRepo.find({
      relations: { customer: true },
      order: { paymentDate: 'DESC' },
    });

    // Map payments by invoiceNumber or customer
    const paymentsByInvoice = new Map<string, CustomerPayment[]>();
    for (const cp of customerPayments) {
      if (cp.salesInvoiceId) {
        const list = paymentsByInvoice.get(cp.salesInvoiceId) || [];
        list.push(cp);
        paymentsByInvoice.set(cp.salesInvoiceId, list);
      }
    }

    let totalReceivable = 0;
    let totalReceived = 0;
    let totalOutstanding = 0;
    let overdueCount = 0;
    let totalOverdueAmount = 0;

    let records = sales.map((sale) => {
      const saleDate = sale.createdAt ? new Date(sale.createdAt).toISOString().slice(0, 10) : '';
      const invPayments = paymentsByInvoice.get(sale.invoiceNumber) || [];
      const paymentTotal = invPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const grandTotal = Number(sale.grandTotal || 0);

      // In POS, if not recorded via CustomerPayment, the sale payments are counted
      const paidAmount = Number(paymentTotal.toFixed(2));
      const outstanding = Number(Math.max(0, grandTotal - paidAmount).toFixed(2));

      let status = 'UNPAID';
      if (paidAmount >= grandTotal - 0.01) status = 'PAID';
      else if (paidAmount > 0) status = 'PARTIALLY_PAID';

      totalReceivable += grandTotal;
      totalReceived += paidAmount;
      totalOutstanding += outstanding;

      return {
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        invoiceDate: saleDate,
        dueDate: saleDate, // POS sales due upon issue
        customerId: sale.customerId,
        customerName: sale.customerName || 'Walk-in Customer',
        invoiceAmount: grandTotal,
        paidAmount,
        outstanding,
        status,
        isOverdue: false,
        payments: invPayments,
      };
    });

    if (query?.status && query.status.toUpperCase() !== 'ALL') {
      records = records.filter((r) => r.status === query.status);
    }

    return {
      summary: {
        totalReceivable: Number(totalReceivable.toFixed(2)),
        totalReceived: Number(totalReceived.toFixed(2)),
        totalOutstanding: Number(totalOutstanding.toFixed(2)),
        totalOverdueAmount: Number(totalOverdueAmount.toFixed(2)),
        overdueCount,
        invoiceCount: records.length,
      },
      records,
    };
  }

  // =========================================================
  // 10. FINANCE DASHBOARD
  // =========================================================

  async getDashboard(query?: FinanceQueryDto) {
    const range = this.getDateRangeFromPeriod(query?.period || 'month', query?.startDate, query?.endDate);

    // 1. Transactions Query
    const txnQb = this.transactionRepo.createQueryBuilder('t');
    if (range.start) txnQb.andWhere('t.transactionDate >= :start', { start: range.start });
    if (range.end) txnQb.andWhere('t.transactionDate <= :end', { end: range.end });

    const periodTxns = await txnQb.getMany();

    let totalIncome = 0;
    let totalExpenses = 0;
    for (const t of periodTxns) {
      const amt = Number(t.amount || 0);
      if (t.type === TransactionType.INCOME) totalIncome += amt;
      else if (t.type === TransactionType.EXPENSE) totalExpenses += amt;
    }

    const netProfit = Number((totalIncome - totalExpenses).toFixed(2));

    // 2. All-Time Cash and Bank Balances
    const allTxns = await this.transactionRepo.find();
    let cashBalance = 0;
    let bankBalance = 0;

    for (const t of allTxns) {
      const amt = Number(t.amount || 0);
      if (t.paymentMethod === FinancePaymentMethod.CASH) {
        cashBalance += t.type === TransactionType.INCOME ? amt : -amt;
      } else if (t.paymentMethod === FinancePaymentMethod.BANK) {
        bankBalance += t.type === TransactionType.INCOME ? amt : -amt;
      }
    }

    // 3. Accounts Payable Summary
    const apData = await this.getAccountsPayable();
    const accountsPayable = apData.summary.totalOutstanding;

    // 4. Accounts Receivable Summary
    const arData = await this.getAccountsReceivable();
    const accountsReceivable = arData.summary.totalOutstanding;

    // 5. Recent 8 Transactions
    const recentTransactions = await this.transactionRepo.find({
      relations: { customer: true, supplier: true },
      order: { transactionDate: 'DESC', id: 'DESC' },
      take: 8,
    });

    // 6. Monthly Income vs Expenses (Last 6 Months)
    const monthlyData: { month: string; income: number; expense: number; profit: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);

      let mIncome = 0;
      let mExpense = 0;
      for (const t of allTxns) {
        if (t.transactionDate >= startOfMonth && t.transactionDate <= endOfMonth) {
          const amt = Number(t.amount || 0);
          if (t.type === TransactionType.INCOME) mIncome += amt;
          else if (t.type === TransactionType.EXPENSE) mExpense += amt;
        }
      }

      monthlyData.push({
        month: mStr,
        income: Number(mIncome.toFixed(2)),
        expense: Number(mExpense.toFixed(2)),
        profit: Number((mIncome - mExpense).toFixed(2)),
      });
    }

    // 7. Top Expense Categories
    const expenseCategoryMap = new Map<string, number>();
    for (const t of periodTxns) {
      if (t.type === TransactionType.EXPENSE) {
        const cat = t.category || 'General';
        expenseCategoryMap.set(cat, (expenseCategoryMap.get(cat) || 0) + Number(t.amount || 0));
      }
    }
    const topExpenseCategories = Array.from(expenseCategoryMap.entries())
      .map(([category, amount]) => ({ category, amount: Number(amount.toFixed(2)) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      period: query?.period || 'month',
      startDate: range.start,
      endDate: range.end,
      cards: {
        totalIncome: Number(totalIncome.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        netProfit,
        cashBalance: Number(cashBalance.toFixed(2)),
        bankBalance: Number(bankBalance.toFixed(2)),
        accountsReceivable: Number(accountsReceivable.toFixed(2)),
        accountsPayable: Number(accountsPayable.toFixed(2)),
      },
      recentTransactions,
      monthlyChart: monthlyData,
      topExpenseCategories,
    };
  }

  // =========================================================
  // 11. FINANCIAL REPORTS

  // A. PROFIT & LOSS REPORT
  async getProfitLossReport(startDate?: string, endDate?: string) {
    const range = this.getDateRangeFromPeriod('custom', startDate, endDate);
    const qb = this.transactionRepo.createQueryBuilder('t');

    if (range.start) qb.andWhere('t.transactionDate >= :start', { start: range.start });
    if (range.end) qb.andWhere('t.transactionDate <= :end', { end: range.end });

    const txns = await qb.getMany();

    const incomeByCategory = new Map<string, number>();
    const expenseByCategory = new Map<string, number>();

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const t of txns) {
      const amt = Number(t.amount || 0);
      const cat = t.category || 'Other';
      if (t.type === TransactionType.INCOME) {
        totalIncome += amt;
        incomeByCategory.set(cat, (incomeByCategory.get(cat) || 0) + amt);
      } else if (t.type === TransactionType.EXPENSE) {
        totalExpenses += amt;
        expenseByCategory.set(cat, (expenseByCategory.get(cat) || 0) + amt);
      }
    }

    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    return {
      period: {
        startDate: range.start || 'Beginning of time',
        endDate: range.end || 'Present',
      },
      income: {
        total: Number(totalIncome.toFixed(2)),
        breakdown: Array.from(incomeByCategory.entries()).map(([category, amount]) => ({
          category,
          amount: Number(amount.toFixed(2)),
        })),
      },
      expenses: {
        total: Number(totalExpenses.toFixed(2)),
        breakdown: Array.from(expenseByCategory.entries()).map(([category, amount]) => ({
          category,
          amount: Number(amount.toFixed(2)),
        })),
      },
      netProfit: Number(netProfit.toFixed(2)),
      profitMargin: Number(profitMargin.toFixed(2)),
    };
  }
// B. CASH FLOW REPORT
async getCashFlowReport(startDate?: string, endDate?: string) {
  const range = this.getDateRangeFromPeriod('custom', startDate, endDate);


  // 1. Calculate opening balances before the report period
  let openingCash = 0;
  let openingBank = 0;

  if (range.start) {
    const priorTxns = await this.transactionRepo
      .createQueryBuilder('t')
      .where('t.transactionDate < :start', {
        start: range.start,
      })
      .getMany();

    for (const t of priorTxns) {
      const amount = Number(t.amount || 0);

      if (t.paymentMethod === FinancePaymentMethod.CASH) {
        if (t.type === TransactionType.INCOME) {
          openingCash += amount;
        } else if (t.type === TransactionType.EXPENSE) {
          openingCash -= amount;
        }
      }

      if (t.paymentMethod === FinancePaymentMethod.BANK) {
        if (t.type === TransactionType.INCOME) {
          openingBank += amount;
        } else if (t.type === TransactionType.EXPENSE) {
          openingBank -= amount;
        }
      }
    }
  }

  // 2. Get period transactions
  const qb = this.transactionRepo.createQueryBuilder('t');

  if (range.start) {
    qb.andWhere('t.transactionDate >= :start', {
      start: range.start,
    });
  }

  if (range.end) {
    qb.andWhere('t.transactionDate <= :end', {
      end: range.end,
    });
  }

  qb.orderBy('t.transactionDate', 'ASC').addOrderBy('t.id', 'ASC');

  const periodTxns = await qb.getMany();

  
  // 3. Calculate cash flow
  let cashIn = 0;
  let cashOut = 0;
  let bankIn = 0;
  let bankOut = 0;

  for (const t of periodTxns) {
    const amount = Number(t.amount || 0);

    if (t.paymentMethod === FinancePaymentMethod.CASH) {
      if (t.type === TransactionType.INCOME) {
        cashIn += amount;
      } else if (t.type === TransactionType.EXPENSE) {
        cashOut += amount;
      }
    }

    if (t.paymentMethod === FinancePaymentMethod.BANK) {
      if (t.type === TransactionType.INCOME) {
        bankIn += amount;
      } else if (t.type === TransactionType.EXPENSE) {
        bankOut += amount;
      }
    }
  }

  // 4. Totals
  const totalInflow = cashIn + bankIn;
  const totalOutflow = cashOut + bankOut;

  const netCashFlow = totalInflow - totalOutflow;

  
  // 5. Closing balances
  const closingCash = openingCash + cashIn - cashOut;
  const closingBank = openingBank + bankIn - bankOut;
  const closingBalance = closingCash + closingBank;

  return {
    period: {
      startDate: range.start || 'All Time',
      endDate: range.end || 'Present',
    },

    openingBalance: {
      cash: Number(openingCash.toFixed(2)),
      bank: Number(openingBank.toFixed(2)),
      total: Number((openingCash + openingBank).toFixed(2)),
    },

    inflows: {
      cashIn: Number(cashIn.toFixed(2)),
      bankIn: Number(bankIn.toFixed(2)),
      total: Number(totalInflow.toFixed(2)),
    },

    outflows: {
      cashOut: Number(cashOut.toFixed(2)),
      bankOut: Number(bankOut.toFixed(2)),
      total: Number(totalOutflow.toFixed(2)),
    },

    netCashFlow: Number(netCashFlow.toFixed(2)),

    closingBalance: {
      cash: Number(closingCash.toFixed(2)),
      bank: Number(closingBank.toFixed(2)),
      total: Number(closingBalance.toFixed(2)),
    },

    summary: {
      totalInflows: Number(totalInflow.toFixed(2)),
      totalOutflows: Number(totalOutflow.toFixed(2)),
      netCashFlow: Number(netCashFlow.toFixed(2)),
      closingCash: Number(closingCash.toFixed(2)),
      closingBank: Number(closingBank.toFixed(2)),
      closingBalance: Number(closingBalance.toFixed(2)),
    },
  };
}

  // C. BALANCE SHEET REPORT (PRACTICAL ERP SUMMARY)
async getBalanceSheetReport(asOfDate?: string) {
  const cutoff =
    asOfDate || new Date().toISOString().slice(0, 10);

  
  // 1. Finance Transactions up to the selected date
  const txns = await this.transactionRepo
    .createQueryBuilder('t')
    .where('t.transactionDate <= :cutoff', {
      cutoff,
    })
    .getMany();

  let cashBalance = 0;
  let bankBalance = 0;

  for (const t of txns) {
    const amount = Number(t.amount || 0);

    if (t.paymentMethod === FinancePaymentMethod.CASH) {
      if (t.type === TransactionType.INCOME) {
        cashBalance += amount;
      } else if (t.type === TransactionType.EXPENSE) {
        cashBalance -= amount;
      }
    }

    if (t.paymentMethod === FinancePaymentMethod.BANK) {
      if (t.type === TransactionType.INCOME) {
        bankBalance += amount;
      } else if (t.type === TransactionType.EXPENSE) {
        bankBalance -= amount;
      }
    }
  }

  
  // 2. Accounts Receivable
  
  const arData = await this.getAccountsReceivable({
    endDate: cutoff,
  });

  const accountsReceivable =
    Number(arData.summary.totalOutstanding || 0);

  // 3. Inventory Valuation
  const products = await this.productRepo.find();

  let inventoryValue = 0;

  for (const product of products) {
    const stockQuantity =
      Number(product.stockQuantity || 0);

    const purchaseCost =
      Number(
        product.purchasePrice ||
        product.sellingPrice ||
        0,
      );

    if (stockQuantity > 0 && purchaseCost > 0) {
      inventoryValue +=
        stockQuantity * purchaseCost;
    }
  }

  // 4. Total Assets
  const totalCurrentAssets =
    cashBalance +
    bankBalance +
    accountsReceivable +
    inventoryValue;

  const totalAssets = totalCurrentAssets;

  // 5. Accounts Payable
  const apData = await this.getAccountsPayable({
    endDate: cutoff,
  });

  const accountsPayable =
    Number(apData.summary.totalOutstanding || 0);

  // 6. Total Liabilities
  const totalLiabilities = accountsPayable;

  // 7. Retained Earnings
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const t of txns) {
    const amount = Number(t.amount || 0);

    if (t.type === TransactionType.INCOME) {
      totalIncome += amount;
    } else if (t.type === TransactionType.EXPENSE) {
      totalExpenses += amount;
    }
  }

  const retainedEarnings =
    totalIncome - totalExpenses;

  const totalEquity =
    totalAssets - totalLiabilities;

  // 9. Balance Check
  const totalLiabilitiesAndEquity =
    totalLiabilities + totalEquity;

  const balanceDifference =
    totalAssets - totalLiabilitiesAndEquity;

  const isBalanced =
    Math.abs(balanceDifference) < 0.01;

  // 10. Return Report
  return {
    asOfDate: cutoff,

    assets: {
      currentAssets: {
        cashOnHand: Number(
          cashBalance.toFixed(2),
        ),

        bankAccounts: Number(
          bankBalance.toFixed(2),
        ),

        accountsReceivable: Number(
          accountsReceivable.toFixed(2),
        ),

        inventoryValuation: Number(
          inventoryValue.toFixed(2),
        ),
      },

      totalCurrentAssets: Number(
        totalCurrentAssets.toFixed(2),
      ),

      totalAssets: Number(
        totalAssets.toFixed(2),
      ),
    },

    liabilities: {
      currentLiabilities: {
        accountsPayable: Number(
          accountsPayable.toFixed(2),
        ),
      },

      totalCurrentLiabilities: Number(
        totalLiabilities.toFixed(2),
      ),

      totalLiabilities: Number(
        totalLiabilities.toFixed(2),
      ),
    },

    equity: {
      retainedEarnings: Number(
        retainedEarnings.toFixed(2),
      ),

      totalEquity: Number(
        totalEquity.toFixed(2),
      ),

      totalLiabilitiesAndEquity: Number(
        totalLiabilitiesAndEquity.toFixed(2),
      ),
    },

    balanceCheck: {
      totalAssets: Number(
        totalAssets.toFixed(2),
      ),

      totalLiabilitiesAndEquity: Number(
        totalLiabilitiesAndEquity.toFixed(2),
      ),

      difference: Number(
        balanceDifference.toFixed(2),
      ),

      isBalanced,
    },
  };
}
}
