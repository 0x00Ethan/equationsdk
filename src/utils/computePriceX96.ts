import Decimal from 'decimal.js';

/**
 * For Contract: value * 2^96
 * @param value
 * @param tokenDecimals
 * @param usdDecimals
 * @returns
 */
export function computePriceX96(
	value: string,
	tokenDecimals: number,
	usdDecimals: number
): string {
	try {
		return new Decimal(value)
			.mul(new Decimal(10).pow(usdDecimals))
			.div(new Decimal(10).pow(tokenDecimals))
			.mul(new Decimal(2).pow(96))
			.toFixed(0);
	} catch {
		return '0';
	}
}

/**
 * For interface: priceX96 / 2^96
 * @param priceX96
 * @param tokenDecimals
 * @param usdDecimals
 * @returns
 */
export function calculatePrice(
	priceX96: string,
	tokenDecimals: number,
	usdDecimals: number
): string {
	try {
		return new Decimal(priceX96.toString())
			.div(new Decimal(2).pow(96))
			.mul(new Decimal(10).pow(tokenDecimals))
			.div(new Decimal(10).pow(usdDecimals))
			.toFixed();
	} catch {
		return '0';
	}
}
