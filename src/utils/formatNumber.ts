import { isNumeric } from './math';
import { ethers } from 'ethers';
import Decimal from 'decimal.js';
import { DEFAULT_USER_PRECISION } from '../config';

export function toDecimalPlaces(
	value: string | number | Decimal,
	precision: number = DEFAULT_USER_PRECISION,
	roundingMode: Decimal.Rounding = Decimal.ROUND_DOWN
) {
	try {
		const num = new Decimal(value).toFixed(precision, roundingMode);
		return num;
	} catch (e) {
		return String(value || '-');
	}
}

/**
 * Extension of ethers.utils.parseUnits
 * parseUnits(2.4, 6) ===> 2.4 * 10 ^ 6
 * @param value
 * @param precision
 * @returns
 */
export function parseUnits(value: string | number, precision?: number) {
	if (!isNumeric(value)) {
		return '0';
	}
	
	try {
		return new Decimal(
			ethers.utils
				.parseUnits(toDecimalPlaces(value, precision), precision)
				.toString()
		).toFixed();
	} catch (error) {
		return '0';
	}
}

/**
 * Extension of ethers.utils.formatUnits
 * parseUnits(2.4, 6) ===> 2.4 / 10 ^ 6
 * @param value
 * @param precision
 * @returns
 */
export function formatUnits(value: string, precision?: number): string {
	if (!isNumeric(value)) {
		return '0';
	}
	try {
		return new Decimal(
			ethers.utils.formatUnits(toDecimalPlaces(value, 0), precision).toString()
		).toFixed();
	} catch (error) {
		return '0';
	}
}