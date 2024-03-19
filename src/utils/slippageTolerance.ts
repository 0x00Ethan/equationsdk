import { div, minus, multipliedBy, plus } from '../utils';

export function priceRangesByTolerance(
    value: string | undefined,
	slippage: string | number
){
    const minPrice = multipliedBy(value, minus(1, div(slippage, 100)));
    const maxPrice = multipliedBy(value, plus(1, div(slippage, 100)));

    return {
        minPrice,
        maxPrice,
    };

}