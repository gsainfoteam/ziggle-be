import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { CustomConfigService } from '@lib/custom-config';
import { McpApiKeyGuard } from './mcp-api-key.guard';

const API_KEY = 'a'.repeat(32);

const buildContext = (headers: Record<string, unknown>): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  }) as unknown as ExecutionContext;

describe('McpApiKeyGuard', () => {
  const guard = new McpApiKeyGuard(
    mock<CustomConfigService>({ MCP_API_KEY: API_KEY }),
  );

  it('allows a request with the matching api key', () => {
    expect(guard.canActivate(buildContext({ 'x-api-key': API_KEY }))).toBe(
      true,
    );
  });

  it('rejects a request without an api key', () => {
    expect(() => guard.canActivate(buildContext({}))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a key with a different length', () => {
    expect(() =>
      guard.canActivate(buildContext({ 'x-api-key': 'short' })),
    ).toThrow(UnauthorizedException);
  });

  it('rejects a wrong key with the same length', () => {
    expect(() =>
      guard.canActivate(buildContext({ 'x-api-key': 'b'.repeat(32) })),
    ).toThrow(UnauthorizedException);
  });

  it('rejects a non-string header value', () => {
    expect(() =>
      guard.canActivate(buildContext({ 'x-api-key': [API_KEY, API_KEY] })),
    ).toThrow(UnauthorizedException);
  });
});
