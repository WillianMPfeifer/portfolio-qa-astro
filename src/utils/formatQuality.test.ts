import { describe, expect, it } from 'vitest';
import { formatBundleSize, formatDate, formatScore } from './formatQuality';

describe('formatBundleSize', () => {
  it('returns "indisponível" for null', () => {
    expect(formatBundleSize(null)).toBe('indisponível');
  });

  it('formats bytes under 1 KB in bytes', () => {
    expect(formatBundleSize(512)).toBe('512 B');
  });

  it('formats kilobytes with one decimal', () => {
    expect(formatBundleSize(204_800)).toBe('200.0 KB');
  });

  it('formats megabytes with one decimal', () => {
    expect(formatBundleSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });

  it('returns the given label for null when provided', () => {
    expect(formatBundleSize(null, 'unavailable')).toBe('unavailable');
  });
});

describe('formatDate', () => {
  it('returns "indisponível" for null', () => {
    expect(formatDate(null)).toBe('indisponível');
  });

  it('formats an ISO string as a readable UTC date/time', () => {
    expect(formatDate('2026-09-14T12:34:00.000Z')).toBe('2026-09-14 12:34 UTC');
  });

  it('returns the given label for null when provided', () => {
    expect(formatDate(null, 'unavailable')).toBe('unavailable');
  });
});

describe('formatScore', () => {
  it('returns "indisponível" for null', () => {
    expect(formatScore(null)).toBe('indisponível');
  });

  it('formats a 0-1 score as a rounded percentage', () => {
    expect(formatScore(0.95)).toBe('95');
    expect(formatScore(1)).toBe('100');
    expect(formatScore(0.904)).toBe('90');
  });

  it('returns the given label for null when provided', () => {
    expect(formatScore(null, 'unavailable')).toBe('unavailable');
  });
});
