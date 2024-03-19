/**
 * @module modules/markets
 * @description Represents a PositionRouter.
 */

import { catchFn, computePriceX96, div, plus, getPositionRouterContract, formatMarket, priceRangesByTolerance, isPositive, isEqualTo, isGreaterThanOrEqual, multipliedBy, toDecimalPlaces, isLessThan } from '../utils'
import { parseUnits } from 'ethers/lib/utils';
import { Contract, Wallet } from 'ethers';
import { MaxUint256 } from '@ethersproject/constants';
import { 
    CONFIG,
    Side,
    DEFAULT_PRECISION,
    DEFAULT_QUOTE_PRECISION,
    DEFAULT_SETTING_SLIPPAGE,
    DEFAULT_QUOTE_AMOUNT
} from '../config';
import { PriceUtil } from '../entities/PriceUtil';
import { UtilHelper } from '../entities/UtilHelper';
import { PositionUtil } from '../entities/PositionUtil';
import { Markets } from "./Markets";
import Approval from "./Approval";
import invariant from 'tiny-invariant';

export default class PositionRouter {
    provider: Wallet;
    positionRouterContract: Contract;
    positionMinExecutionFee: string;
    slippage: string;
    approval: Approval;
    account: string;

    constructor(provider:Wallet, slippage = DEFAULT_SETTING_SLIPPAGE) {
        this.provider = provider;
        this.slippage = slippage;
        this.positionRouterContract = getPositionRouterContract(provider);
        this.positionMinExecutionFee = '0';
        this.approval = new Approval(provider)
        this.account = '';
        this.executionFee();
        this.getAccount();
    }

    async executionFee() {
        const dataConfigInfo = await Markets.fetchGasConfig();
        this.positionMinExecutionFee = dataConfigInfo.positionExecutionFee;
    }

    async getAccount() {
        this.account = await this.provider.getAddress();
    }

    async approvalPosition(){
        const allowanceAmount = await this.approval.fetchAllowance(CONFIG.Router)
        if(!isGreaterThanOrEqual(allowanceAmount, DEFAULT_QUOTE_AMOUNT)){
            await this.approval.approvalToken(CONFIG.Router)
        }
        const isPluginApproved = await this.approval.isPluginApproved(CONFIG.PositionRouter)
        if(!isPluginApproved){
            await this.approval.approvalPlugin(CONFIG.PositionRouter)
        }
    }
    
    /**
     * Create open or increase the size of existing position request
     * 
     * @param market - The market in which to increase position
     * @param side - The side of the position (Long or Short)
     * @param marginDelta - The increase in position margin
     * @param sizeDelta - TThe increase in position size
     * @returns A Promise that resolves to the result of creating the increased position.
     */
    async createIncreasePosition(
        market: string,
        side: Side,
        marginDelta: string,
        sizeDelta: string,
    ) {
        const allowanceAmount = await this.approval.fetchAllowance(CONFIG.Router)
        if(isLessThan(allowanceAmount, marginDelta)){
            invariant(!isLessThan(allowanceAmount, marginDelta), 'Please approvalPosition the contract to spend tokens');
            return;
        }
        const isPluginApproved = await this.approval.isPluginApproved(CONFIG.PositionRouter)
        if(!isPluginApproved){
            invariant(isPluginApproved, 'Please approvalPosition the contract to spend tokens');
            return;
        }
        
        const marketAddresses = [market];
        const markets = await Markets.fetchMarketList();
        const tokensPrice = await Markets.fetchMarketTokensPrice(marketAddresses);
        const tokensMultiPrice = await Markets.fetchMarketMultiTokens(marketAddresses);
        const marketsItem = markets?.find((marketsItem: any) => marketsItem.address === market);
        const tokenPriceItem = tokensPrice?.find((tokenItem: any) => tokenItem.address === market);
        const tokenMultiPriceItem = tokensMultiPrice?.find((tokenItem: any) => tokenItem.address === market);
        const marketInfo = formatMarket(marketsItem, tokenPriceItem, tokenMultiPriceItem);
        const entryPrice = PriceUtil.calculateMarketPrice(
            sizeDelta,
            marketInfo.globalLiquidityPosition,
            marketInfo.priceState,
            side,
            marketInfo.indexPriceX96,
            DEFAULT_PRECISION
        );
        const { minPrice, maxPrice } = priceRangesByTolerance(entryPrice, this.slippage);
        const acceptablePrice = side === Side.LONG ? maxPrice : minPrice;
        const acceptablePriceX96 = computePriceX96(
			acceptablePrice,
			DEFAULT_PRECISION,
			DEFAULT_QUOTE_PRECISION
		);
        try {
            const res = await this.positionRouterContract.createIncreasePosition(market, side, parseUnits(toDecimalPlaces(marginDelta,DEFAULT_QUOTE_PRECISION), DEFAULT_QUOTE_PRECISION), parseUnits(toDecimalPlaces(sizeDelta,DEFAULT_PRECISION), DEFAULT_PRECISION), acceptablePriceX96, { value: this.positionMinExecutionFee })
            return res.hash;
        } catch (error) {
            throw (`Failed to create increase position request. ${error}`);
        }
    }


    /**
     * Create decrease position request
     * 
     * @param market - The market in which to decrease position
     * @param side - The side of the position (Long or Short)
     * @param sizeDelta - The decrease in position size
     * @returns  A Promise that resolves to the result of creating the decreased position. 
     */
    async createDecreasePosition(
        market: string,
        side: Side,
        sizeDelta: string,
    ) {
        const marketAddresses = [market];
        const markets = await Markets.fetchMarketList();
        const positions = await Markets.fetchPositions({"account": this.account, "market": market});
        const tokensPrice = await Markets.fetchMarketTokensPrice(marketAddresses);
        const tokensMultiPrice = await Markets.fetchMarketMultiTokens(marketAddresses);

        const marketsItem = markets?.find((marketsItem: any) => marketsItem.address === market);
        const tokenPriceItem = tokensPrice?.find((tokenItem: any) => tokenItem.address === market);
        const tokenMultiPriceItem = tokensMultiPrice?.find((tokenItem: any) => tokenItem.address === market);
        const positionInfo = positions?.find((positionItem: any) => positionItem.side === side);
        const marketInfo = formatMarket(marketsItem, tokenPriceItem, tokenMultiPriceItem);
        const flipSide = UtilHelper.flipSide(side);
        const indexPriceX96 = flipSide === Side.LONG ? marketInfo.maxIndexPriceX96 : marketInfo.minIndexPriceX96
        const tradePrice = catchFn(() => {
                        return PriceUtil.calculateMarketPrice(
                            sizeDelta,
                            marketInfo.globalLiquidityPosition,
                            marketInfo.priceState,
                            flipSide,
                            indexPriceX96,
                            DEFAULT_PRECISION
                        );
                    }, '');
                    
        const { minPrice, maxPrice } = priceRangesByTolerance(tradePrice, this.slippage);
        const acceptablePrice = side === Side.LONG ?  minPrice : maxPrice;
        const acceptablePriceX96 = computePriceX96(
			acceptablePrice,
			DEFAULT_PRECISION,
			DEFAULT_QUOTE_PRECISION
		);
        const lightenRatio = (!isPositive(tradePrice) || !isPositive(sizeDelta)) ?  '0' : div(sizeDelta, positionInfo.size);
        const UnrealizedPnL = PositionUtil.calculateUnrealizedPnL(
            positionInfo.side,
            positionInfo.size,
            positionInfo.entryPrice,
            tradePrice
        );
        const closeUnrealizedPnL = multipliedBy(lightenRatio, UnrealizedPnL);
        const marginDelta = isEqualTo(lightenRatio, 1) ? '0' : plus(multipliedBy(lightenRatio, positionInfo.margin), closeUnrealizedPnL);
        try {
            const res = await this.positionRouterContract.createDecreasePosition(market, side, parseUnits(toDecimalPlaces(marginDelta,DEFAULT_QUOTE_PRECISION), DEFAULT_QUOTE_PRECISION), parseUnits(toDecimalPlaces(sizeDelta,DEFAULT_PRECISION), DEFAULT_PRECISION), acceptablePriceX96, this.account, { value: this.positionMinExecutionFee })
            return res.hash;
        } catch (error) {
            throw (`Failed to create decrease position request. ${error}`);
        }
    }
}  
