import { ArgumentMetadata, ValidationPipe, UnprocessableEntityException } from '@nestjs/common';
import { CreateCashTransactionDto } from './create-cash-transaction.dto';

describe('CreateCashTransactionDto - Validation Test', () => {
  let pipe: ValidationPipe;
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: CreateCashTransactionDto,
  };

  beforeEach(() => {
    pipe = new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: 422,
    });
  });

  it('harus menerima data valid dengan amount bertipe number', async () => {
    const validBody = {
      type: 'ticket_sale',
      amount: 50000,
    };

    const result = await pipe.transform(validBody, metadata);
    expect(result).toBeInstanceOf(CreateCashTransactionDto);
    expect(result.amount).toBe(50000);
  });

  it('harus menolak dengan pesan "Inputan harus berupa angka" jika amount bertipe string', async () => {
    const invalidBody = {
      type: 'ticket_sale',
      amount: '50000',
    };

    try {
      await pipe.transform(invalidBody, metadata);
      fail('Harusnya melempar UnprocessableEntityException');
    } catch (err) {
      expect(err).toBeInstanceOf(UnprocessableEntityException);
      const response = (err as UnprocessableEntityException).getResponse() as any;
      expect(response.message).toContain('Inputan harus berupa angka');
    }
  });

  it('harus menolak dengan pesan "Nominal kas tidak boleh kurang dari 0" jika amount bernilai negatif', async () => {
    const invalidBody = {
      type: 'ticket_sale',
      amount: -1000,
    };

    try {
      await pipe.transform(invalidBody, metadata);
      fail('Harusnya melempar UnprocessableEntityException');
    } catch (err) {
      expect(err).toBeInstanceOf(UnprocessableEntityException);
      const response = (err as UnprocessableEntityException).getResponse() as any;
      expect(response.message).toContain('Nominal kas tidak boleh kurang dari 0');
    }
  });
});
