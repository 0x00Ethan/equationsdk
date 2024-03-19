import * as url from './url';
import { get, post, postFromData } from './http';
import { IOrdersParams, IPositionsParams } from '../../types';

export function getTokensPrice(addresses: string[] | undefined) {
    return post(url.tokensPrice, {addresses});
}

export function getMultiTokens(addresses: string[] | undefined) {
    return post(url.multiTokens, {addresses});
}

export function getMarkets() {
    return get(url.markets);
}

export function getMarketInfo(address: string | undefined) {
    return get(`${url.markets}/${address}`);
}

export function getPositions(params:IPositionsParams) {
    return post(url.positions, {...params});
}

export function getOrders(params: IOrdersParams) {
    return postFromData(url.orders, params);
}


export function getGasConfig(){
    return get(url.gasConfig);
}


