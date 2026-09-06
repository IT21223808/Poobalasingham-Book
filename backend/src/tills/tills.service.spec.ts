import { Test, TestingModule } from '@nestjs/testing';
import { TillsService } from './tills.service';

describe('TillsService', () => {
  let service: TillsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TillsService],
    }).compile();

    service = module.get<TillsService>(TillsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
