import { BASIS_POINTS_DIVISOR, DEFAULT_PRECISION } from '../config';
import Decimal from 'decimal.js';

export function isNumeric(value: Decimal.Value) {
	return !isNaN(parseFloat(String(value)));
}


export function plus(value1: Decimal.Value, value2: Decimal.Value) {
    if (!isNumeric(value1) || !isNumeric(value2)) return '0';
	return new Decimal(value1).plus(value2).toString();
}

export function minus(value1: Decimal.Value, value2: Decimal.Value) {
    if (!isNumeric(value1) || !isNumeric(value2)) return '0';
	return new Decimal(value1).minus(value2).toString();
}

export function multipliedBy(value1: Decimal.Value, value2: Decimal.Value) {
    if (!isNumeric(value1) || !isNumeric(value2)) return '0';
	return new Decimal(value1).mul(value2).toString();
}

export function div(value1: Decimal.Value, value2: Decimal.Value): string {
    if (!isNumeric(value1) || !isNumeric(value2)) return '0';
	return new Decimal(value1).div(value2).toString();
}

export function abs(value: Decimal.Value): string {
	if (!isNumeric(value)) return '0';
	return new Decimal(value).abs().toString();
}

export function neg(value: Decimal.Value): string {
	if (!isNumeric(value)) return '0';
	return new Decimal(value).neg().toString();
}

export function trunc(value: Decimal.Value): string {
	if (!isNumeric(value)) return '0';
	return new Decimal(value).trunc().toString();
}

export function mod(value1: Decimal.Value, value2: Decimal.Value): string {
    if (!isNumeric(value1) || !isNumeric(value2)) return '0';
	return new Decimal(value1).mod(value2).toString();
}

export function isGreaterThan(value1: Decimal.Value, value2: Decimal.Value) {
	if (!isNumeric(value1) || !isNumeric(value2)) return false;
	return new Decimal(value1).greaterThan(value2);
}

export function isGreaterThanOrEqual(
	value1: Decimal.Value,
	value2: Decimal.Value
) {
	if (!isNumeric(value1) || !isNumeric(value2)) return false;
	return new Decimal(value1).greaterThanOrEqualTo(value2);
}

export function isLessThan(value1: Decimal.Value, value2: Decimal.Value) {
	if (!isNumeric(value1) || !isNumeric(value2)) return false;
	return new Decimal(value1).lessThan(value2);
}

export function isLessThanOrEqualTo(
	value1: Decimal.Value,
	value2: Decimal.Value
) {
	if (!isNumeric(value1) || !isNumeric(value2)) return false;
	return new Decimal(value1).lessThanOrEqualTo(value2);
}

export function isEqualTo(value1: Decimal.Value, value2: Decimal.Value) {
	if (!isNumeric(value1) || !isNumeric(value2)) return false;
	return new Decimal(value1).equals(value2);
}

export function isZero(value: Decimal.Value | undefined) {
	if (value === undefined) {
		return false;
	}
	try {
		return new Decimal(value).isZero();
	} catch {
		return false;
	}
}

export function isPositive(value: Decimal.Value | undefined) {
	if (value === undefined) {
		return false;
	}
	if (!isNumeric(value)) {
		return false;
	}
	try {
		return new Decimal(value).greaterThan(0);
	} catch {
		return false;
	}
}

export function isNegative(value: Decimal.Value | undefined) {
	if (value === undefined) {
		return false;
	}
	try {
		return new Decimal(value).isNegative();
	} catch {
		return false;
	}
}

export function mulDiv(
	a: Decimal.Value,
	b: Decimal.Value,
	c: Decimal.Value,
	roundingMode: Decimal.Rounding = Decimal.ROUND_DOWN,
	precision = 0
) {
    if (!isNumeric(a) || !isNumeric(b) || !isNumeric(c)) return '0';
	return new Decimal(a).mul(b).div(c).toFixed(precision, roundingMode);
}

export function bigIntMulDiv(
	x: bigint,
	y: bigint,
	denominator: bigint,
	ceil?: boolean
) {
	let result = (x * y) / denominator;
	if (ceil && (x * y) % denominator !== 0n) result += 1n;

	return result;
}
export function bigIntMulDiv2(x: bigint, y: bigint, denominator: bigint) {
	const down = (x * y) / denominator;
	let up = down;
	if ((x * y) % denominator !== 0n) up += 1n;
	return { down, up };
}

export function ceilDiv(a: Decimal.Value, b: Decimal.Value, precision = 0) {
    if (!isNumeric(a) || !isNumeric(b)) return '0';
	return new Decimal(a).div(b).toFixed(precision, Decimal.ROUND_UP).toString();
}

export function floorDiv(a: Decimal.Value, b: Decimal.Value, precision = 0) {
    if (!isNumeric(a) || !isNumeric(b)) return '0';
	return new Decimal(a)
		.div(b)
		.toFixed(precision, Decimal.ROUND_DOWN)
		.toString();
}

export function solveQuadraticEquation(
	a: Decimal.Value,
	b: Decimal.Value,
	c: Decimal.Value
) {
	// b^2 - 4ac
	const discriminant = minus(
		multipliedBy(b, b),
		multipliedBy(4, multipliedBy(a, c))
	);

	if (isGreaterThan(discriminant, 0)) {
		const x1 = div(
			plus(-b, new Decimal(discriminant).sqrt()),
			multipliedBy(2, a)
		);
		const x2 = div(
			minus(-b, new Decimal(discriminant).sqrt()),
			multipliedBy(2, a)
		);
		return [x1, x2];
	} else if (isEqualTo(discriminant, 0)) {
		const x = div(-b, multipliedBy(2, a));
		return [x];
	} else {
		return [];
	}
}

/**
 * (y - y₁) / (x - x₁) = (y₂ - y₁) / (x₂ - x₁)
 * x = ((y - y₁) / (y₂ - y₁)) * (x₂ - x₁) + x₁
 */
export function getPointOnLine(
	y: Decimal.Value,
	x1: Decimal.Value,
	y1: Decimal.Value,
	x2: Decimal.Value,
	y2: Decimal.Value
) {
	if (isEqualTo(x1, x2) && isEqualTo(y1, y2)) {
		return new Decimal(x1).toString();
	}
	return new Decimal(y)
		.minus(y1)
		.div(minus(y2, y1))
		.mul(minus(x2, x1))
		.plus(x1)
		.toString();
}

// S = BR * L / Pi
export function getPointSize(
	BR: Decimal.Value,
	L: Decimal.Value,
	Pi: Decimal.Value
) {
	const br = new Decimal(BR).div(BASIS_POINTS_DIVISOR);
	return new Decimal(br)
		.mul(L)
		.div(Pi)
		.toFixed(DEFAULT_PRECISION, Decimal.ROUND_UP)
		.toString();
}
