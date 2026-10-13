import { mock } from 'jest-mock-extended';
import { CustomConfigService } from '@lib/custom-config';
import { LlmService } from './llm.service';

const create = jest.fn();
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(() => ({ chat: { completions: { create } } })),
}));

const respond = (content: unknown) =>
  create.mockResolvedValue({
    choices: [
      {
        message: {
          content:
            typeof content === 'string' ? content : JSON.stringify(content),
        },
      },
    ],
  });

const DEADLINE = new Date('2026-03-15T00:00:00Z');
const DEADLINE_LABEL = '2026년 3월 15일';

describe('LlmService', () => {
  let service: LlmService;

  beforeEach(() => {
    create.mockReset();
    service = new LlmService(
      mock<CustomConfigService>({
        LETSUR_API_KEY: 'key',
        LETSUR_GATEWAY_URL: 'http://llm.test',
        LLM_MODEL: 'model',
      }),
    );
  });

  it('returns the parsed summary and keywords', async () => {
    respond({ summary: ' 요약입니다. ', keywords: ['장학금', '신청'] });

    await expect(service.summarize('본문')).resolves.toEqual({
      summary: '요약입니다.',
      keywords: ['장학금', '신청'],
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'model' }),
    );
  });

  it('rejects empty text without calling the LLM', async () => {
    await expect(service.summarize('   ')).rejects.toThrow(
      'Text to summarize cannot be empty',
    );
    expect(create).not.toHaveBeenCalled();
  });

  it.each([
    ['empty content', ''],
    ['invalid json', '{not json'],
    ['missing keywords', { summary: '요약' }],
    ['non-string summary', { summary: 1, keywords: ['a'] }],
    ['blank summary', { summary: '  ', keywords: ['a'] }],
    ['no usable keywords', { summary: '요약', keywords: [' ', 1] }],
  ])('throws on %s', async (_, content) => {
    respond(content);

    await expect(service.summarize('본문')).rejects.toThrow();
  });

  it('trims, dedupes and limits keywords to 12', async () => {
    const keywords = [
      ' a ',
      'a',
      1,
      ...Array.from({ length: 15 }, (_, i) => `k${i}`),
    ];
    respond({ summary: '요약', keywords });

    const result = await service.summarize('본문');

    expect(result.keywords[0]).toBe('a');
    expect(result.keywords).toHaveLength(12);
    expect(new Set(result.keywords).size).toBe(12);
  });

  describe('with a deadline', () => {
    it('replaces ISO dates with the korean label', async () => {
      respond({ summary: '2026-03-15까지 신청하세요.', keywords: ['a'] });

      const { summary } = await service.summarize('본문', DEADLINE);

      expect(summary).toBe(`${DEADLINE_LABEL}까지 신청하세요.`);
    });

    it('appends the deadline when the summary omits it', async () => {
      respond({ summary: '신청하세요.', keywords: ['a'] });

      const { summary } = await service.summarize('본문', DEADLINE);

      expect(summary).toBe(`신청하세요. 마감일은 ${DEADLINE_LABEL}입니다.`);
    });

    it('keeps the deadline when truncating a long summary', async () => {
      respond({ summary: 'a'.repeat(600), keywords: ['a'] });

      const { summary } = await service.summarize('본문', DEADLINE);

      expect(summary.length).toBeLessThanOrEqual(500);
      expect(summary.endsWith(`... 마감일은 ${DEADLINE_LABEL}입니다.`)).toBe(
        true,
      );
    });
  });

  it('truncates a long summary to 500 characters', async () => {
    respond({ summary: 'a'.repeat(600), keywords: ['a'] });

    const { summary } = await service.summarize('본문');

    expect(summary).toHaveLength(500);
    expect(summary.endsWith('...')).toBe(true);
  });
});
