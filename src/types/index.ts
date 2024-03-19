import { Side} from '../config';
import type { Merge } from 'type-fest';

export interface TokenInfo {
	readonly chainId: number;
	readonly address: string;
	readonly name: string;
	readonly decimals: number;
	readonly symbol: string;
	readonly isNative?: boolean;
	readonly isToken?: boolean;
	readonly logoURI?: string;
	readonly tags?: string[];
	readonly wrapped?: TokenInfo;
	readonly precision: number;
	readonly positionUnits: number;
	readonly sort?: number;
}
export interface IGlobalLiquidityPosition {
	entryPriceX96: string;
	liquidity: string;
	netSize: string;
	side: Side;
	realizedProfitGrowthX64: string;
	entryPrice: string;
	margin: string;
	realizedProfit: string;
	realizedProfitGrowth: string;
	tradingFee: string;
	liquidationBufferNetSize: string;
	tokenVertices: {
		id: string;
		premiumRate: string;
		balanceRate: string;
	}[];
}

export type IGlobalLiquidityPositionBigInt = Merge<
	IGlobalLiquidityPosition,
	{
		netSize: bigint;
		liquidationBufferNetSize: bigint;
		liquidity: bigint;
	}
>;

export interface IGlobalUnrealizedLossMetrics {
	lastZeroLossTime: number;
	liquidity: string;
	liquidityTimesUnrealizedLoss: string;
}


export interface IPriceVertex {
	size: string;
	premiumRate: string;
	premiumRateX96: string;
}

export type IPriceVertexBigInt = Merge<
	IPriceVertex,
	{
		size: bigint;
		premiumRateX96: bigint;
	}
>;

export interface IPriceState {
	maxPriceImpactLiquidity: any;
	premiumRateX96: string;
	pendingVertexIndex: number;
	liquidationVertexIndex: number;
	currentVertexIndex: number;
	priceVertices: Array<IPriceVertex>;
	liquidationBufferNetSizes: Array<string>;
	indexPriceX96?: string;
	basisIndexPriceX96?: string;
}

export type IPriceStateBigInt = Merge<
	IPriceState,
	{
		maxPriceImpactLiquidity: bigint;
		premiumRateX96: bigint;
		priceVertices: Array<IPriceVertexBigInt>;
		liquidationBufferNetSizes: Array<bigint>;
		indexPriceX96?: bigint;
		basisIndexPriceX96?: bigint;
	}
>;

export interface IState {
	priceState: IPriceStateBigInt;
	globalLiquidityPosition: IGlobalLiquidityPositionBigInt;
}

export interface IOrdersParams {
	account: string;
	market: string;
	status: string;
	limit: number;
	from: string | undefined;
	hashes: Array<string> | undefined;
}

export interface IPositionsParams {
	account: string;
	market?: string;
	hashes?: Array<string> | undefined;
}

export interface IGlobalPosition {
	fundingRate: string;
	lastAdjustFundingRateTime: number;
	longSize: string;
	shortSize: string;
	longFundingRateGrowthX96: string;
	shortFundingRateGrowthX96: string;
	margin: string;
	liquidity: string;
}

export interface IGlobalFundingRateSample {
	lastAdjustFundingRateTime: string;
	sampleCount: string;
	cumulativePremiumRateX96: string;
}

export interface IPoolItem {
	id: string;
	baseSymbol: string;
	baseToken: TokenInfo;
	price: string;
	volume24h: string;
	realizedProfit24h: string;
	liquidityRewardPerDay: string;
	fee24h: string;
	fundingFee24h: string;
	positions: string;
	priceChange: string;
	tradingFeeRate: string;
	maxPriceImpactLiquidity: string;
	globalPosition: IGlobalPosition;
	globalLiquidityPosition: IGlobalLiquidityPosition;
	sample: IGlobalFundingRateSample;
	token: {
		id: any;
		decimals: number;
		maxPrice: any;
		maxPriceX96: any;
		minMarginPerLiquidityPosition: any;
		maxLeveragePerLiquidityPosition: any;
		maxRiskRatePerLiquidityPosition: any;
		minMarginPerPosition: any;
		maxLeveragePerPosition: any;
		liquidationFeeRatePerPosition: any;
		minPrice: any;
		minPriceX96: any;
		name: string;
		price: any;
		priceX96: any;
		protocolFeeRate: any;
		tradingFeeRate: any;
		liquidationExecutionFee: any;
		symbol: string;
		interestRate: any;
		maxFundingRate: any;
		maxPriceImpactLiquidity: any;
		liquidationVertexIndex: number;
		liquidityFeeRate: any;
		referralDiscountRate: any;
		referralParentReturnFeeRate: any;
		referralReturnFeeRate: any;
		vertices: Array<{
			__typename?: 'VertexConfig';
			id: string;
			premiumRate: any;
			balanceRate: any;
		}>;
	};
	marketPrice: string | number;
	indexPrice: string | number;
	address: string;

	market_price_x96: string;
	market_price: string;
	min_market_price_x96: string;
	min_market_price: string;
	max_market_price_x96: string;
	max_market_price: string;
	index_price_x96: string;
	index_price: string;
	min_index_price_x96: string;
	min_index_price: string;
	max_index_price_x96: string;
	max_index_price: string;
	price_change: string;
	price_change_rate: string;
	createdList?: Array<string>;
	priceChangeDirection?: 'up' | 'down' | '';
	priceState: IPriceState;
	maxPriceX96: string;
	referralDiscountRate: string;
	longSize: string;
	shortSize: string;
	liquidationExecutionFee: string;
	liquidationFeeRatePerLiquidityPosition: string;
	liquidationFeeRatePerPosition: string;

	maxLeveragePerPosition: number;
	maxLeveragePerLiquidityPosition: number;
	minMarginPerLiquidityPosition: string;
	minMarginPerPosition: string;
	globalUnrealizedLossMetrics: IGlobalUnrealizedLossMetrics;
	[key: string]: any;
}