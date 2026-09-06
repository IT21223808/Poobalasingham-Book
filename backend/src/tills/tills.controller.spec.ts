import { Test, TestingModule } from '@nestjs/testing';
import { TillsController } from './tills.controller';

describe('TillsController', () => {
  let controller: TillsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TillsController],
    }).compile();

    controller = module.get<TillsController>(TillsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
