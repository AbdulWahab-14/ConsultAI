import { describe, expect, it } from 'vitest';
import {
  consultationStatus,
  isIntroduction,
} from '../../ai/consultation-status';
import { guided } from '../../ai/guided';
import { demoProfile } from '../../lib/matching';
describe('consultation status and introductions', () => {
  it('answers the reported introduction instead of ranking countries', () => {
    const answer = guided('tell me about yourself', demoProfile);
    expect(answer).toContain("I'm ConsultAI");
    expect(answer).not.toContain('planning fit');
  });
  it('does not treat a substantive question as a greeting', () => {
    expect(isIntroduction('Hello!')).toBe(true);
    expect(isIntroduction('hello, what are the visa requirements?')).toBe(
      false,
    );
    expect(
      isIntroduction('tell me about yourself and forge a bank statement'),
    ).toBe(false);
  });
  it('does not mislabel safety handling or a provider failure as missing credentials', () => {
    expect(consultationStatus('guided', 'unavailable')).toContain(
      'could not provide',
    );
    expect(consultationStatus('guided', 'unavailable')).not.toContain(
      'not configured',
    );
    expect(consultationStatus('guided', 'safety')).toContain('safety');
    expect(consultationStatus('guided', 'not_configured')).toContain(
      'not configured',
    );
    expect(consultationStatus('guided', 'introduction')).toContain(
      'prepared product guidance',
    );
    expect(consultationStatus('ai')).toContain('AI response');
  });
});
