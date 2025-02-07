// Silenciar logs durante os testes
global.console = {
  ...console,
  error: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Limpar todos os mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
});
