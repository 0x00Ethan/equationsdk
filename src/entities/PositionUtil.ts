import { BASIS_POINTS_DIVISOR, Q96, Side } from '../config';
import Decimal from 'decimal.js';

import {
	abs,
	div,
	isGreaterThan,
	isGreaterThanOrEqual,
	isLessThan,
	isPositive,
	minus,
	mulDiv,
	multipliedBy,
	plus
} from '../utils';

export class PositionUtil {
	public static MIN_ENTRY_PRICE_X96 = 1;

	public static chooseFundingRateGrowthX96(
		_longFundingRateGrowthX96: string,
		_shortFundingRateGrowthX96: string,
		_side: Side
	) {
		return _side === Side.LONG
			? _longFundingRateGrowthX96
			: _shortFundingRateGrowthX96;
	}

	public static calculateMarginRate(
		_entryPrice: string,
		_size: string,
		_price: string,
		_liquidationFeeRate: number | string,
		_tradingFeeRate: number | string,
		_liquidationExecutionFee: string,
		_marign: string
	) {
		const _maintenanceMargin = this.calculateMaintenanceMargin(
			_entryPrice,
			_size,
			_price,
			_liquidationFeeRate,
			_tradingFeeRate,
			_liquidationExecutionFee
		);
		return div(_maintenanceMargin, _marign);
	}

	/**
	 * @param _entryPrice
	 * @param _size
	 * @param _price
	 * @param _liquidationFeeRatePerPosition
	 * @param _tradingFeeRate
	 * @param _liquidationExecutionFee
	 * @returns
	 */
	public static calculateMaintenanceMargin(
		_entryPrice: string,
		_size: string,
		_price: string,
		_liquidationFeeRate: number | string,
		_tradingFeeRate: number | string,
		_liquidationExecutionFee: string
	) {
		const _liquidatioFee = plus(
			multipliedBy(multipliedBy(_size, _entryPrice), _liquidationFeeRate),
			_liquidationExecutionFee
		);
		const _tradingFee = multipliedBy(
			multipliedBy(_size, _price),
			_tradingFeeRate
		);
		return plus(_liquidatioFee, _tradingFee);
	}

	public static calculateLiqPrice(
		_side: Side,
		_netMargin: string,
		_size: string,
		_entryPrice: string,
		_liquidationExecutionFee: string,
		_liquidationFeeRate: string | number,
		_tradingFeeRate: string | number
	) {
		if (!isPositive(_netMargin) || !isPositive(_size)) {
			return '';
		}

		const openPositionValue = multipliedBy(_entryPrice, _size);
		// const totalRate = plus(_liquidationFeeRate, tradingFeeRate);
		// const divisor = _long? minus()
		let liqPrice;
		if (_side === Side.LONG) {
			liqPrice = div(
				plus(
					div(
						minus(
							plus(
								multipliedBy(openPositionValue, _liquidationFeeRate),
								_liquidationExecutionFee
							),
							_netMargin
						),
						_size
					),
					_entryPrice
				),
				minus(1, _tradingFeeRate)
			);
		} else {
			liqPrice = multipliedBy(
				div(
					minus(
						div(
							minus(
								plus(
									multipliedBy(openPositionValue, _liquidationFeeRate),
									_liquidationExecutionFee
								),
								_netMargin
							),
							_size
						),
						_entryPrice
					),
					plus(1, _tradingFeeRate)
				),
				-1
			);
		}

		return liqPrice;
	}

	public static calculateLeverage(_netMargin: string, _liquidity: string) {
		return div(_liquidity, _netMargin);
	}

	public static calculateLiquidationPriceX96(
		_side: Side,
		_positionMargin: string,
		_positionSize: string,
		_positionLiquidity: string,
		_fundingFee: string,
		_liquidationFeeRate: string | number,
		_tradingFeeRate: string | number,
		_liquidationExecutionFee: string
	) {
		let marginAfter = _positionMargin;
		if (isPositive(_fundingFee)) {
			marginAfter = plus(marginAfter, _fundingFee);
		} else {
			const __fundingFee = abs(_fundingFee);
			// invariant(isGreaterThanOrEqual(marginAfter, __fundingFee));
			marginAfter = minus(marginAfter, __fundingFee);
		}

		if (_side === Side.LONG) {
			let numerator = multipliedBy(
				_positionLiquidity,
				plus(BASIS_POINTS_DIVISOR, _liquidationFeeRate)
			);
			if (isGreaterThanOrEqual(marginAfter, _liquidationExecutionFee)) {
				const numeratorPart2 = multipliedBy(
					minus(marginAfter, _liquidationExecutionFee),
					BASIS_POINTS_DIVISOR
				);
				// invariant(isGreaterThan(numerator, numeratorPart2));
				numerator = minus(numerator, numeratorPart2);
			} else {
				const numeratorPart2 = multipliedBy(
					minus(_liquidationExecutionFee, marginAfter),
					BASIS_POINTS_DIVISOR
				);
				numerator = plus(numerator, numeratorPart2);
			}
			// if (isNegative(numerator)) {
			// 	return '0';
			// }
			return mulDiv(
				numerator,
				Q96,
				multipliedBy(
					_positionSize,
					minus(BASIS_POINTS_DIVISOR, _tradingFeeRate)
				)
			);
		} else {
			let numerator = multipliedBy(
				_positionLiquidity,
				minus(BASIS_POINTS_DIVISOR, _liquidationFeeRate)
			);
			if (isGreaterThanOrEqual(marginAfter, _liquidationExecutionFee)) {
				const numeratorPart2 = multipliedBy(
					minus(marginAfter, _liquidationExecutionFee),
					BASIS_POINTS_DIVISOR
				);
				numerator = plus(numerator, numeratorPart2);
			} else {
				const numeratorPart2 = multipliedBy(
					minus(_liquidationExecutionFee, marginAfter),
					BASIS_POINTS_DIVISOR
				);
				// invariant(isGreaterThan(numerator, numeratorPart2));
				numerator = minus(numerator, numeratorPart2);
			}
			return mulDiv(
				numerator,
				Q96,
				multipliedBy(_positionSize, plus(BASIS_POINTS_DIVISOR, _tradingFeeRate))
			);
		}
	}

	/**
	 * @param _globalFundingRateGrowthX96
	 * @param _positionFundingRateGrowthX96
	 * @param _positionSize
	 * @returns
	 */
	public static calculateFundingFee(
		_globalFundingRateGrowthX96: string,
		_positionFundingRateGrowthX96: string,
		_positionSize: string
	) {
		const fundingRateGrowthDeltaX96 = minus(
			_globalFundingRateGrowthX96,
			_positionFundingRateGrowthX96
		);
		if (isGreaterThanOrEqual(fundingRateGrowthDeltaX96, 0)) {
			return mulDiv(fundingRateGrowthDeltaX96, _positionSize, Q96);
		} else {
			return String(
				-mulDiv(
					-fundingRateGrowthDeltaX96,
					_positionSize,
					Q96,
					Decimal.ROUND_UP
				)
			);
		}
	}

	/**
	 * @param _side
	 * @param _size
	 * @param _entryPriceX96
	 * @param _priceX96
	 * @returns
	 */
	public static calculateUnrealizedPnLByPriceX96(
		_side: Side,
		_size: string,
		_entryPriceX96: string,
		_priceX96: string
	) {
		if (_side === Side.LONG) {
			if (isGreaterThan(_entryPriceX96, _priceX96)) {
				return -mulDiv(
					_size,
					minus(_entryPriceX96, _priceX96),
					Q96,
					Decimal.ROUND_UP
				);
			} else {
				return mulDiv(
					_size,
					minus(_priceX96, _entryPriceX96),
					Q96,
					Decimal.ROUND_DOWN
				);
			}
		} else {
			if (isLessThan(_entryPriceX96, _priceX96)) {
				return -mulDiv(
					_size,
					minus(_priceX96, _entryPriceX96),
					Q96,
					Decimal.ROUND_UP
				);
			} else {
				return mulDiv(
					_size,
					minus(_entryPriceX96, _priceX96),
					Q96,
					Decimal.ROUND_DOWN
				);
			}
		}
	}

	public static calculateUnrealizedPnL(
		_side: Side,
		_size: string,
		_entryPrice: string,
		_price: string
	) {
		if (_side === Side.LONG) {
			if (isGreaterThan(_entryPrice, _price)) {
				return -multipliedBy(_size, minus(_entryPrice, _price));
			} else {
				return multipliedBy(_size, minus(_price, _entryPrice));
			}
		} else {
			if (isLessThan(_entryPrice, _price)) {
				return -multipliedBy(_size, minus(_price, _entryPrice));
			} else {
				return multipliedBy(_size, minus(_entryPrice, _price));
			}
		}
	}

	/**
	 * @param _isGradeThan
	 * @param _size
	 * @param _entryPrice
	 * @param _price
	 * @returns
	 */
	public static calculateTakeProfitStopLossPrice(
		_isGradeThan: boolean,
		_size: string,
		_entryPrice: string,
		_price: string
	) {
		if (_isGradeThan) {
			return plus(div(_price, _size), _entryPrice);
		} else {
			return minus(_entryPrice, div(_price, _size));
		}
	}
}
