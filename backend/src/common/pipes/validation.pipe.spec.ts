import { ValidationPipe, ArgumentMetadata, UnprocessableEntityException } from '@nestjs/common';
import { CreateOrderDto } from '../../modules/orders/dto/create-order.dto';

describe('PRIORITAS 2.4 — Validasi Input (Global ValidationPipe)', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: 422,
    });
  });

  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: CreateOrderDto,
  };

  it('harus menolak request dengan 422 jika terdapat field asing (forbidNonWhitelisted)', async () => {
    const maliciousBody = {
      eventId: 'event-uuid-1',
      buyerEmail: 'valid@example.com',
      buyerName: 'Budi Santoso',
      items: [{ ticketCategoryId: 'cat-1', qty: 1 }],
      unknownHackerField: 'should-be-forbidden', // Field asing!
    };

    await expect(pipe.transform(maliciousBody, metadata)).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('harus menolak request dengan 422 jika format email salah', async () => {
    const invalidEmailBody = {
      eventId: 'event-uuid-1',
      buyerEmail: 'bukan-alamat-email', // Email tidak valid
      buyerName: 'Budi Santoso',
      items: [{ ticketCategoryId: 'cat-1', qty: 1 }],
    };

    await expect(pipe.transform(invalidEmailBody, metadata)).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('harus meloloskan dan mentransformasikan body yang valid dan bersih', async () => {
    const validBody = {
      eventId: 'event-uuid-1',
      buyerEmail: 'buyer@example.com',
      buyerName: 'Budi Santoso',
      items: [{ ticketCategoryId: 'cat-1', qty: 2 }],
    };

    const result = await pipe.transform(validBody, metadata);
    expect(result).toBeInstanceOf(CreateOrderDto);
    expect(result.buyerEmail).toBe('buyer@example.com');
  });
});
