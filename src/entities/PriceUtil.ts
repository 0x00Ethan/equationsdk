import {
	DEFAULT_PRECISION,
	DEFAULT_QUOTE_PRECISION,
	QUOTE_USD_PRECISION,
	Side,
	SideFlip
} from '../config';

import { cloneDeep } from 'lodash';
import {
	IGlobalLiquidityPosition,
	IGlobalLiquidityPositionBigInt,
	IPriceState,
	IPriceStateBigInt,
	IPriceVertex,
	IPriceVertexBigInt,
	IState
} from '../types';
import {
	bigIntMulDiv,
	bigIntMulDiv2,
	calculatePrice,
	isZero,
	parseUnits
} from '../utils';

export interface IMoveStep {
	side: Side;
	sizeLeft: any;
	indexPriceX96: bigint;
	basisIndexPriceX96: bigint;
	improveBalance: boolean;
	from: IPriceVertexBigInt;
	current: IPriceVertexBigInt;
	to: IPriceVertexBigInt;
}

export interface UpdatePriceStateParameter {
	side: Side;
	sizeDelta: bigint;
	indexPriceX96: bigint;
	liquidationVertexIndex: number;
	liquidation: boolean;
}

export interface IPriceConfig {
	maxPriceImpactLiquidity: bigint;
	liquidationVertexIndex: number;
	vertices: { balanceRate: number; premiumRate: number }[];
}

export const VERTEX_NUM = 10;
export const LATEST_VERTEX = VERTEX_NUM - 1;
export const VERTEX_BASIS_POINT_DIVISOR = 100_000_000;
export const Q96 = 1n << 96n;
export const Q152 = 1n << 152n;

export class PriceUtil {
	public static calculateMarketPrice(
		sizeDelta: string,
		globalLiquidityPosition: IGlobalLiquidityPosition,
		priceState: IPriceState,
		side: Side,
		indexPriceX96: string,
		baseDecimal: number,
		quoteDecimal = QUOTE_USD_PRECISION
	) {
		if (isZero(globalLiquidityPosition.liquidity)) {
			return '0';
		}
		const _sizeDelta = BigInt(parseUnits(sizeDelta, DEFAULT_PRECISION));
		const _indexPriceX96 = BigInt(indexPriceX96);
		const _globalLiquidityPosition = {
			...globalLiquidityPosition,
			netSize: BigInt(
				parseUnits(globalLiquidityPosition.netSize, DEFAULT_PRECISION)
			),
			liquidationBufferNetSize: BigInt(
				parseUnits(
					globalLiquidityPosition.liquidationBufferNetSize,
					DEFAULT_PRECISION
				)
			),
			liquidity: BigInt(
				parseUnits(globalLiquidityPosition.liquidity, DEFAULT_QUOTE_PRECISION)
			)
		} as IGlobalLiquidityPositionBigInt;
		const _priceState = {
			...priceState,
			premiumRateX96: BigInt(priceState.premiumRateX96),
			priceVertices: priceState.priceVertices.map((item: IPriceVertex) => ({
				premiumRateX96: BigInt(item.premiumRateX96),
				size: BigInt(parseUnits(item.size, DEFAULT_PRECISION))
			})),
			liquidationBufferNetSizes: priceState.liquidationBufferNetSizes.map(
				item => BigInt(parseUnits(item, DEFAULT_PRECISION))
			),
			indexPriceX96: BigInt(indexPriceX96),
			basisIndexPriceX96: BigInt(priceState.basisIndexPriceX96)
		};
		const _priceConfig = {
			maxPriceImpactLiquidity: BigInt(priceState.maxPriceImpactLiquidity),
			liquidationVertexIndex: priceState.liquidationVertexIndex,
			vertices: globalLiquidityPosition.tokenVertices.map(item => ({
				balanceRate: BigInt(item.balanceRate),
				premiumRate: BigInt(item.premiumRate)
			}))
		};
		const _state = {
			priceState: _priceState,
			globalLiquidityPosition: _globalLiquidityPosition
		};

		const _parameter = {
			side,
			sizeDelta: _sizeDelta,
			indexPriceX96: _indexPriceX96,
			liquidationVertexIndex: priceState.liquidationVertexIndex,
			liquidation: false
		};

		const updatePriceStateObj = this.updatePriceState(
			_state,
			_priceConfig,
			_parameter
		) as { tradePriceX96: any; };
		
		return calculatePrice(String(updatePriceStateObj?.tradePriceX96), baseDecimal, quoteDecimal);
	}

	public static updatePriceState(
		state: any,
		priceConfig: any,
		parameter: UpdatePriceStateParameter
	) {
		const globalLiquidityPositionCache = cloneDeep(
			state.globalLiquidityPosition
		);
		const priceState = state.priceState;
		const priceStateCache = cloneDeep(priceState);

		const balanced =
			(globalLiquidityPositionCache.netSize |
				globalLiquidityPositionCache.liquidationBufferNetSize) ===
			0;
		if (balanced) {
			priceStateCache.basisIndexPriceX96 = parameter.indexPriceX96;
		}

		const improveBalance =
			parameter.side == globalLiquidityPositionCache.side && !balanced;
		// eslint-disable-next-line prefer-const
		let { tradePriceX96TimesSizeTotal, sizeLeft, totalBufferUsed } =
			this._updatePriceState(
				globalLiquidityPositionCache,
				priceState,
				priceStateCache,
				parameter,
				improveBalance
			);

		if (!improveBalance) {
			globalLiquidityPositionCache.side = SideFlip(parameter.side);
			globalLiquidityPositionCache.netSize +=
				parameter.sizeDelta - totalBufferUsed;
			globalLiquidityPositionCache.liquidationBufferNetSize += totalBufferUsed;
		} else {
			// When the net position of LP decreases and reaches or crosses the vertex,
			// at least the vertex represented by (current, pending] needs to be updated
			if (
				priceStateCache.pendingVertexIndex > priceStateCache.currentVertexIndex
			) {
				this.changePriceVertex(
					state,
					priceConfig,
					parameter.indexPriceX96,
					priceStateCache.currentVertexIndex,
					LATEST_VERTEX
				);
			}

			globalLiquidityPositionCache.netSize -=
				parameter.sizeDelta - sizeLeft - totalBufferUsed;
			globalLiquidityPositionCache.liquidationBufferNetSize -= totalBufferUsed;
		}

		if (sizeLeft > 0n) {
			globalLiquidityPositionCache.side = SideFlip(
				globalLiquidityPositionCache.side
			);

			priceStateCache.basisIndexPriceX96 = parameter.indexPriceX96;
			const sizeDeltaCopy = parameter.sizeDelta;
			parameter.sizeDelta = sizeLeft;

			const {
				tradePriceX96TimesSizeTotal: tradePriceX96TimesSizeTotal2,
				totalBufferUsed: totalBufferUsed2
			} = this._updatePriceState(
				globalLiquidityPositionCache,
				priceState,
				priceStateCache,
				parameter,
				false
			);
			if (
				tradePriceX96TimesSizeTotal === 0n ||
				tradePriceX96TimesSizeTotal2 === 0n
			) {
				return 0n;
			}

			parameter.sizeDelta = sizeDeltaCopy;
			tradePriceX96TimesSizeTotal += tradePriceX96TimesSizeTotal2;
			globalLiquidityPositionCache.netSize = sizeLeft - totalBufferUsed2;
			globalLiquidityPositionCache.liquidationBufferNetSize = totalBufferUsed2;
		}

		if (tradePriceX96TimesSizeTotal < 0n) {
			return {
				tradePriceX96: -1n,
				priceStateCache: priceState,
				globalLiquidityPositionCache: state.globalLiquidityPosition
			};
		}

		const tradePriceX96:any =
			parameter.side === Side.LONG
				? bigIntMulDiv(
						tradePriceX96TimesSizeTotal,
						1n,
						parameter.sizeDelta,
						true
				  )
				: tradePriceX96TimesSizeTotal / parameter.sizeDelta;

		return {
			tradePriceX96,
			priceStateCache,
			globalLiquidityPositionCache
		};
	}

	private static _updatePriceState(
		globalPositionCache: IGlobalLiquidityPositionBigInt,
		priceState: IPriceStateBigInt,
		priceStateCache: IPriceStateBigInt,
		parameter: UpdatePriceStateParameter,
		improveBalance: boolean
	) {
		const sizeLeft = parameter.sizeDelta;
		const step = {
			side: parameter.side,
			sizeLeft,
			indexPriceX96: parameter.indexPriceX96,
			basisIndexPriceX96: priceStateCache.basisIndexPriceX96,
			improveBalance,
			from: { size: 0n, premiumRateX96: 0n },
			current: {
				size: globalPositionCache.netSize,
				premiumRateX96: priceStateCache.premiumRateX96
			},
			to: { size: 0n, premiumRateX96: 0n }
		} as IMoveStep;

		let tradePriceX96TimesSizeTotal = 0n;
		let totalBufferUsed = 0n;
		if (!step.improveBalance) {
			if (priceStateCache.currentVertexIndex == 0)
				priceStateCache.currentVertexIndex = 1;
			const end = parameter.liquidation
				? priceStateCache.liquidationVertexIndex + 1
				: VERTEX_NUM;
			for (
				let i = priceStateCache.currentVertexIndex;
				i < end && step.sizeLeft > 0n;
				++i
			) {
				[step.from, step.to] = [
					priceStateCache.priceVertices[i - 1],
					priceStateCache.priceVertices[i]
				];
				const { tradePriceX96, sizeUsed, premiumRateAfterX96 } =
					this.simulateMove(step);
				if (
					sizeUsed < step.sizeLeft &&
					!(
						parameter.liquidation && i == priceStateCache.liquidationVertexIndex
					)
				) {
					priceStateCache.currentVertexIndex = i + 1;
					step.current = step.to;
				}
				step.sizeLeft -= sizeUsed;
				tradePriceX96TimesSizeTotal += tradePriceX96 * sizeUsed;
				priceStateCache.premiumRateX96 = premiumRateAfterX96;
			}
			if (step.sizeLeft > 0n) {
				if (!parameter.liquidation) {
					return { tradePriceX96TimesSizeTotal: 0n, sizeLeft, totalBufferUsed };
				}
				totalBufferUsed += step.sizeLeft;
				const liquidationVertexIndex = priceStateCache.liquidationVertexIndex;
				const liquidationBufferNetSizeAfter =
					priceState.liquidationBufferNetSizes[liquidationVertexIndex] +
					step.sizeLeft;
				priceState.liquidationBufferNetSizes[liquidationVertexIndex] =
					liquidationBufferNetSizeAfter;
				return { tradePriceX96TimesSizeTotal, sizeLeft, totalBufferUsed };
			}
		} else {
			for (
				let i = priceStateCache.currentVertexIndex;
				i >= 0 && step.sizeLeft > 0n;
				--i
			) {
				let bufferSizeAfter = priceState.liquidationBufferNetSizes[i];
				if (bufferSizeAfter > 0n) {
					step.from = step.to = priceState.priceVertices[i];
					const { tradePriceX96 } = this.simulateMove(step);
					const sizeUsed =
						bufferSizeAfter > step.sizeLeft ? step.sizeLeft : bufferSizeAfter;

					bufferSizeAfter -= sizeUsed;
					priceState.liquidationBufferNetSizes[i] = bufferSizeAfter;
					totalBufferUsed += sizeUsed;

					step.sizeLeft -= sizeUsed;
					tradePriceX96TimesSizeTotal += tradePriceX96 * sizeUsed;
				}
				if (i === 0) {
					break;
				}

				if (step.sizeLeft > 0n) {
					[step.from, step.to] = [
						priceState.priceVertices[i],
						priceState.priceVertices[i - 1]
					];
					const { tradePriceX96, sizeUsed, reached, premiumRateAfterX96 } =
						this.simulateMove(step);
					if (reached) {
						priceStateCache.currentVertexIndex = i - 1;
						step.current = step.to;
					}
					step.sizeLeft -= sizeUsed;
					tradePriceX96TimesSizeTotal += tradePriceX96 * sizeUsed;
					priceStateCache.premiumRateX96 = premiumRateAfterX96;
				}
			}
		}
		return {
			tradePriceX96TimesSizeTotal,
			sizeLeft: step.sizeLeft,
			totalBufferUsed
		};
	}

	private static _calculatePriceVertex(
		_vertexCfg: any,
		_liquidity: bigint,
		_indexPriceX96: bigint
	) {
		return {
			size: bigIntMulDiv(
				(Q96 * _vertexCfg.balanceRate) / BigInt(VERTEX_BASIS_POINT_DIVISOR),
				_liquidity,
				_indexPriceX96
			),
			premiumRateX96:
				(Q96 * _vertexCfg.premiumRate) / BigInt(VERTEX_BASIS_POINT_DIVISOR)
		};
	}

	public static changePriceVertex(
		_state: IState,
		_priceConfig: IPriceConfig,
		_indexPriceX96: bigint,
		_startExclusive: number,
		_endInclusive: number
	) {
		if (_endInclusive < LATEST_VERTEX) {
			const previous = _state.priceState.priceVertices[_endInclusive];
			const next = _state.priceState.priceVertices[_endInclusive + 1];
			if (
				previous.size >= next.size ||
				previous.premiumRateX96 >= next.premiumRateX96
			)
				_endInclusive = LATEST_VERTEX;
		}
		return this._changePriceVertex(
			_state,
			_priceConfig,
			_indexPriceX96,
			_startExclusive,
			_endInclusive
		);
	}

	private static _changePriceVertex(
		_state: IState,
		_marketPriceCfg: IPriceConfig,
		_indexPriceX96: bigint,
		_startExclusive: number,
		_endInclusive: number
	) {
		const liquidity =
			_state.globalLiquidityPosition.liquidity <=
			_marketPriceCfg.maxPriceImpactLiquidity
				? _state.globalLiquidityPosition.liquidity
				: _marketPriceCfg.maxPriceImpactLiquidity;
		const priceVertices = _state.priceState.priceVertices;
		const vertexCfgs = _marketPriceCfg.vertices;
		for (let index = _startExclusive + 1; index <= _endInclusive; ++index) {
			let { size: sizeAfter, premiumRateX96: premiumRateAfterX96 } =
				this._calculatePriceVertex(
					vertexCfgs[index],
					liquidity,
					_indexPriceX96
				);
			if (index > 1) {
				const previous = priceVertices[index - 1];
				if (
					previous.size >= sizeAfter ||
					previous.premiumRateX96 >= premiumRateAfterX96
				)
					[sizeAfter, premiumRateAfterX96] = [
						previous.size,
						previous.premiumRateX96
					];
			}
			priceVertices[index].size = sizeAfter;
			priceVertices[index].premiumRateX96 = premiumRateAfterX96;

			if (index == _endInclusive && _endInclusive < LATEST_VERTEX) {
				const next = priceVertices[index + 1];
				if (
					sizeAfter >= next.size ||
					premiumRateAfterX96 >= next.premiumRateX96
				)
					_endInclusive = LATEST_VERTEX;
			}
		}
		return {
			priceVertices
		};
	}

	public static simulateMove(step: IMoveStep) {
		const { reached, sizeUsed } = this.calculateReachedAndSizeUsed(step);
		const premiumRateAfterX96 = this.calculatePremiumRateAfterX96(
			step,
			reached,
			sizeUsed
		);
		const premiumRateBeforeX96 = step.current.premiumRateX96;
		const { down: tradePriceX96Down, up: tradePriceX96Up } = bigIntMulDiv2(
			step.basisIndexPriceX96,
			premiumRateBeforeX96 + premiumRateAfterX96,
			Q96 << 1n
		);

		let tradePriceX96: bigint;
		if (step.side === Side.LONG) {
			tradePriceX96 = step.improveBalance
				? step.indexPriceX96 - tradePriceX96Down
				: step.indexPriceX96 + tradePriceX96Up;
		} else {
			tradePriceX96 = step.improveBalance
				? step.indexPriceX96 + tradePriceX96Down
				: step.indexPriceX96 - tradePriceX96Up;
		}
		return { reached, sizeUsed, tradePriceX96, premiumRateAfterX96 };
	}

	private static calculateReachedAndSizeUsed(step: IMoveStep) {
		const sizeCost = step.improveBalance
			? step.current.size - step.to.size
			: step.to.size - step.current.size;

		const reached = step.sizeLeft >= sizeCost;
		return {
			reached,
			sizeUsed: reached ? sizeCost : step.sizeLeft
		};
	}

	private static calculatePremiumRateAfterX96(
		step: IMoveStep,
		reached: boolean,
		sizeUsed: bigint
	) {
		let premiumRateAfterX96;
		if (reached) {
			premiumRateAfterX96 = step.to.premiumRateX96;
		} else {
			const globalSide = step.improveBalance ? step.side : SideFlip(step.side);
			const AX248AndBX96 = this.calculateAX248AndBX96(
				globalSide,
				step.from,
				step.to
			);
			const aX248 = AX248AndBX96.aX248;
			let bX96 = AX248AndBX96.bX96;

			const sizeAfter = step.improveBalance
				? step.current.size - sizeUsed
				: step.current.size + sizeUsed;
			if (globalSide === Side.LONG) {
				bX96 = BigInt(-bX96);
			}
			premiumRateAfterX96 = bigIntMulDiv(aX248, sizeAfter, Q152, true) + bX96;
		}
		return premiumRateAfterX96;
	}

	private static calculateAX248AndBX96(
		globalSide: Side,
		from: IPriceVertexBigInt,
		to: IPriceVertexBigInt
	) {
		if (from.size > to.size) {
			[from, to] = [to, from];
		}
		const sizeDelta = to.size - from.size;
		const aX248 = bigIntMulDiv(
			to.premiumRateX96 - from.premiumRateX96 as unknown as bigint,
			Q152,
			sizeDelta as unknown as bigint,
			true
		);
		let bX96;
		const numeratorPart1X96 = from.premiumRateX96 * to.size;
		const numeratorPart2X96 = to.premiumRateX96 * from.size;
		if (globalSide === Side.SHORT) {
			if (numeratorPart1X96 >= numeratorPart2X96) {
				bX96 = (numeratorPart1X96 - numeratorPart2X96) / sizeDelta;
			} else {
				bX96 = -((numeratorPart2X96 - numeratorPart1X96) / sizeDelta);
			}
		} else {
			if (numeratorPart2X96 >= numeratorPart1X96) {
				bX96 = (numeratorPart2X96 - numeratorPart1X96) / sizeDelta;
			} else {
				bX96 = -((numeratorPart1X96 - numeratorPart2X96) / sizeDelta);
			}
		}
		return { aX248, bX96 };
	}
}
