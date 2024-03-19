import {
	IGlobalFundingRateSample,
	IGlobalLiquidityPosition,
	IGlobalPosition,
	IPoolItem,
	IPriceState
} from '../types';
import { UtilHelper } from '../entities/UtilHelper';
import dayjs from 'dayjs';
import {
	catchFn,
	div,
	formatRate,
	formatUnits,
	isZero,
	minus,
	multipliedBy,
	neg,
	plus,
	toDecimalPlaces
} from './';
import { Side, QUOTE_USD_PRECISION } from '../config'
import isBetween from 'dayjs/plugin/isBetween'
dayjs.extend(isBetween)


export function formatMarket(
	marketsItem,
	tokenPriceItem,
	tokenMultiPriceItem
) {
        if (!marketsItem || !tokenPriceItem || !tokenMultiPriceItem ) {
            return;
        }
        const { liquidationVertexIndex, maxPriceImpactLiquidity, vertices } = marketsItem.marketConfig.priceConfig;
        const { referralDiscountRate, tradingFeeRate } = marketsItem.marketConfig.feeRateConfig;
        const {
            interestRate,
            maxFundingRate,
            liquidationExecutionFee,
            liquidationFeeRatePerPosition,
            liquidationFeeRatePerLiquidityPosition,
            maxLeveragePerPosition,
            maxLeveragePerLiquidityPosition,
            minMarginPerLiquidityPosition,
            minMarginPerPosition
        } = marketsItem.marketConfig.baseConfig;

        const id = marketsItem.address.toLowerCase();
        // const baseToken = allTokens.get(id);

        // if (!baseToken) {
        //     return;
        // }

        const _globalLiquidityPosition = marketsItem.globalLiquidityPosition;
        const globalLiquidityPosition = {
            ..._globalLiquidityPosition,
            tokenVertices: vertices
        } as IGlobalLiquidityPosition;

        const { longSize, shortSize, lastAdjustFundingRateTime } = marketsItem.globalPosition;
        const positions = multipliedBy(Math.max(longSize, shortSize), 2);

        const { sampleCount, cumulativePremiumRateX96 } = marketsItem.globalFundingRateSample;
        const _lastAdjustFundingRateTime = new Date(lastAdjustFundingRateTime).getTime();
        const isValidSample = dayjs(_lastAdjustFundingRateTime).isSame(dayjs(),'hours');
        const sample = {
            lastAdjustFundingRateTime: isValidSample
                ? _lastAdjustFundingRateTime / 1000
                : dayjs().set('minute',5).set('seconds',0).unix().toString(),
            sampleCount: isValidSample ? sampleCount : '0',
            cumulativePremiumRateX96: isValidSample ? cumulativePremiumRateX96 : '0'
        } as IGlobalFundingRateSample;
        const { premiumRateX96,pendingVertexIndex,priceVertices,liquidationBufferNetSizes,indexPriceUsedX96 } = marketsItem.priceState;

        const _priceVertices = priceVertices.map((item, index: number) => {
            return {
                id: item.id as string,
                premiumRateX96: item.premiumRateX96 as string,
                premiumRate: formatRate(vertices[index].premiumRate),
                size: item.size as string
            };
        });

        const priceState = {
            ...marketsItem.priceState,
            maxPriceImpactLiquidity,
            premiumRateX96,
            pendingVertexIndex,
            liquidationVertexIndex,
            currentVertexIndex: UtilHelper.computeCurrentVertexIndex(
                globalLiquidityPosition.netSize,
                _priceVertices
            ),
            priceVertices: _priceVertices,
            liquidationBufferNetSizes: liquidationBufferNetSizes,
            indexPriceUsedX96,
            indexPriceX96: tokenMultiPriceItem?.indexPriceX96
        } as IPriceState;

        // const fundingRate = catchFn(() => {
        //     return FundingRateUtil.caculateFundingRate(
        //         sample,
        //         globalLiquidityPosition,
        //         priceState,
        //         interestRate || 0,
        //         maxFundingRate || 0
        //     );
        // }, '');

        const balanceRate = catchFn(() => {
            let totalNetSize = plus(
                globalLiquidityPosition?.netSize,
                globalLiquidityPosition?.liquidationBufferNetSize
            );
            totalNetSize =
                globalLiquidityPosition?.side === Side.LONG
                    ? neg(totalNetSize)
                    : totalNetSize;
            const _globalNetLiquidity = toDecimalPlaces(
                multipliedBy(totalNetSize, tokenMultiPriceItem?.indexPrice),
                QUOTE_USD_PRECISION
            );
            if (isZero(globalLiquidityPosition?.liquidity)) {
                return '0';
            }
            return div(_globalNetLiquidity, globalLiquidityPosition?.liquidity);
        }, '0');

        const poolItem = {
            ...tokenPriceItem,
            ...tokenMultiPriceItem,
            index_price: tokenMultiPriceItem?.indexPrice,
            index_price_x96: tokenMultiPriceItem?.indexPriceX96,
            market_price: tokenMultiPriceItem?.marketPrice,
            market_price_x96: tokenMultiPriceItem?.marketPriceX96,
            max_index_price: tokenMultiPriceItem?.maxIndexPrice,
            max_index_price_x96: tokenMultiPriceItem?.maxIndexPriceX96,
            max_market_price: tokenMultiPriceItem?.maxMarketPrice,
            max_market_price_x96: tokenMultiPriceItem?.maxMarketPriceX96,
            min_index_price: tokenMultiPriceItem?.minIndexPrice,
            min_index_price_x96: tokenMultiPriceItem?.minIndexPriceX96,
            min_market_price: tokenMultiPriceItem?.minMarketPrice,
            min_market_price_x96: tokenMultiPriceItem?.minMarketPriceX96,
            baseSymbol: marketsItem.symbol,
            address: id,
            id,
            // baseToken,
            balanceRate,
            price: tokenMultiPriceItem?.marketPrice,
            tradingFeeRate: formatRate(tradingFeeRate),
            maxPriceImpactLiquidity,
            positions,
            priceChange: tokenPriceItem?.priceChangeRate,
            marketPrice: tokenMultiPriceItem?.marketPrice,
            indexPrice: tokenMultiPriceItem?.indexPrice,
            globalPosition: {
                ...marketsItem.globalPosition,
                // fundingRate
            } as IGlobalPosition,
            globalLiquidityPosition,
            sample,
            priceState,
            maxPriceX96: tokenMultiPriceItem?.maxIndexPriceX96,
            referralDiscountRate: formatRate(referralDiscountRate),
            longSize,
            shortSize,
            liquidationExecutionFee: formatUnits(
                liquidationExecutionFee,
                QUOTE_USD_PRECISION
            ),
            liquidationFeeRatePerPosition: formatRate(
                liquidationFeeRatePerPosition
            ),
            liquidationFeeRatePerLiquidityPosition: formatRate(
                liquidationFeeRatePerLiquidityPosition
            ),

            maxLeveragePerPosition,
            maxLeveragePerLiquidityPosition,
            minMarginPerLiquidityPosition: formatUnits(
                minMarginPerLiquidityPosition,
                QUOTE_USD_PRECISION
            ),
            minMarginPerPosition: formatUnits(
                minMarginPerPosition,
                QUOTE_USD_PRECISION
            ),
            globalUnrealizedLossMetrics: marketsItem.globalUnrealizedLossMetrics
        } as IPoolItem;

        return poolItem;
}