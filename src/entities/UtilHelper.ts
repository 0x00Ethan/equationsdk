import { Q96, Side } from '../config';
import Decimal from 'decimal.js';
import { BigNumber } from 'ethers';
import _ from 'lodash-es';
import { IPriceVertex } from '../types';
import {
	div,
	isGreaterThanOrEqual,
	isZero,
	minus,
	multipliedBy,
	plus,
	toDecimalPlaces
} from '../utils';

export class UtilHelper {
	public static toBigIntForPriceX96(priceX96: Decimal.Value, side: Side) {
		if (side === Side.LONG) {
			return BigInt(toDecimalPlaces(priceX96, 0, Decimal.ROUND_CEIL));
		} else {
			return BigInt(toDecimalPlaces(priceX96, 0, Decimal.ROUND_DOWN));
		}
	}

	public static computePriceByPremiumRateX96(
		premiumRateX96: string,
		indexPrice: string
	) {
		return multipliedBy(plus(1, div(premiumRateX96, Q96)), indexPrice);
	}

	public static computeCurrentVertexIndex(
		glpNetSize: string,
		priceVertices: Array<IPriceVertex>
	) {
		if (isZero(glpNetSize)) return 0;
		const index = _.findIndex(priceVertices, (item: IPriceVertex) => {
			return isGreaterThanOrEqual(item.size, glpNetSize);
		});
		return index;
	}

	/**
	 * For Contract: value * 2^96
	 * @param value
	 * @param tokenDecimals
	 * @param usdDecimals
	 * @returns
	 */
	public static computePriceX96(
		value: string,
		tokenDecimals: number,
		usdDecimals: number
	): string {
		return BigNumber.from(
			new Decimal(value)
				.mul(new Decimal(10).pow(usdDecimals))
				.div(new Decimal(10).pow(tokenDecimals))
				.mul(new Decimal(2).pow(96))
				.toFixed(0)
		).toString();
	}

	/**
	 * For interface: priceX96 / 2^96
	 * @param priceX96
	 * @param tokenDecimals
	 * @param usdDecimals
	 * @returns
	 */
	public static calculatePrice(
		priceX96: string | bigint,
		tokenDecimals: number,
		usdDecimals: number
	): string {
		return new Decimal(priceX96.toString())
			.div(new Decimal(2).pow(96))
			.mul(new Decimal(10).pow(tokenDecimals))
			.div(new Decimal(10).pow(usdDecimals))
			.toFixed();
	}

	public static flipSide(side: Side) {
		return side === Side.LONG ? Side.SHORT : Side.LONG;
	}

	public static formatFromX96(value: Decimal.Value | bigint) {
		return new Decimal(String(value)).div(Q96).toFixed();
	}

	public static parseToX96(value: Decimal.Value | bigint) {
		return new Decimal(String(value)).mul(Q96).toFixed();
	}

	public static solveQuadraticEquation(
		a: Decimal.Value,
		b: Decimal.Value,
		c: Decimal.Value
	) {
		const discriminant = minus(
			multipliedBy(b, b),
			multipliedBy(4, multipliedBy(a, c))
		);

		if (isZero(discriminant)) {
			const x = div(-b, multipliedBy(2, a));
			return x;
		}

		const x1 = div(
			plus(-b, new Decimal(discriminant).sqrt()),
			multipliedBy(2, a)
		);
		const x2 = div(
			minus(-b, new Decimal(discriminant).sqrt()),
			multipliedBy(2, a)
		);

		return Decimal.max(x1, x2).toFixed();
	}
}
