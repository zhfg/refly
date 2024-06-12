import { describe, it, expect } from 'vitest';
import { validateStorageKey } from './utils';

describe('validateStorageKey', () => {
	it('should return true for valid storage keys', () => {
		expect(validateStorageKey('resource/a49f817c-8f2f-48a1-80b8-640c77002bee')).toBe(true);
	});

	it('should return false for invalid storage keys', () => {
		expect(validateStorageKey('resource/1234567890abcdef12345678')).toBe(false);
	});

	it('should return false for invalid storage keys without resource prefix', () => {
		expect(validateStorageKey('1234567890abcdef12345678')).toBe(false);
	});
});
