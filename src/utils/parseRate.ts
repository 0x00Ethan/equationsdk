import { BASIS_POINTS_DIVISOR } from '../config';

import { div, multipliedBy } from './math';

/**
 * Multiply the exchange rate by a factor of 10000 for contract-related calculations
 * @param value
 * @returns
 */
export const parseRate = (value: string | number = '') => {
	if (!value) {
		return '0';
	}
	return multipliedBy(value, BASIS_POINTS_DIVISOR);
};

/**
 * When thegraph returns parameters such as the rate,
 * it needs to be divided by the base 10000 format conversion for display.
 * @param value
 * @returns
 */
export const formatRate = (value: string | number = '') => {
	if (!value) {
		return '0';
	}
	return div(value, BASIS_POINTS_DIVISOR);
};
