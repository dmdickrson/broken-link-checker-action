/* eslint-disable no-magic-numbers */
import { Logger } from '@technote-space/github-action-helper';
import { spyOnStdout, stdoutCalledWith } from '@technote-space/github-action-test-helper';
import { checkLinks } from '../../src/utils/check';

jest.mock('../../src/utils/checker', () => {
	return jest.fn().mockImplementation(() => {
		return {
			start: (url, options, events): void => {
				events.link({
					broken: false,
					excluded: true,
					brokenReason: undefined,
					url: {
						original: 'http://example.com/excluded',
						redirected: 'http://example.com/excluded',
					},
				});
				events.junk({
					excluded: true,
					excludedReason: 'BLC_ROBOTS',
					url: {
						original: 'http://example.com/skipped1',
						redirected: 'http://example.com/skipped1',
					},
				});
				events.link({
					broken: true,
					excluded: false,
					brokenReason: 'BLC_INVALID',
					url: {
						original: 'http://example.com/404',
						redirected: 'http://example.com/404',
					},
				});
				events.link({
					broken: false,
					excluded: false,
					brokenReason: undefined,
					url: {
						original: 'http://example.com/ok',
						redirected: 'http://example.com/redirect',
					},
				});
				events.junk({
					excluded: true,
					excludedReason: 'BLC_SAMEPAGE',
					url: {
						original: 'http://example.com/skipped2',
						redirected: 'http://example.com/skipped2',
					},
				});
				events.link({
					broken: true,
					excluded: false,
					brokenReason: 'BLC_KEYWORD',
					url: {
						original: 'http://example.com/400',
						redirected: 'http://example.com/400',
					},
				});
				events.end();
			},
		};
	});
});

beforeEach(() => {
	Logger.resetForTesting();
});

describe('checkLinks', () => {
	it('should return checked links', async() => {
		const mockStdout = spyOnStdout();

		const {brokenLinks, notBrokenLinks} = await checkLinks('https://example.com/test', false, {}, new Logger());

		stdoutCalledWith(mockStdout, [
			'=========================', '> url:',
			'"https://example.com/test"',
			'> options:',
			'{}',
			'=========================',
			'',
			'> skipped: http://example.com/skipped1',
			'> Robots Exclusion',
			'',
			'::warning::broken: http://example.com/404',
			'> Invalid URL',
			'',
			'> skipped: http://example.com/skipped2',
			'> Same-page URL Exclusion',
			'',
			'::warning::broken: http://example.com/400',
			'> Keyword Exclusion',
			'',
		]);
		expect(brokenLinks).toHaveLength(2);
		expect(notBrokenLinks).toHaveLength(3);
	});
});
