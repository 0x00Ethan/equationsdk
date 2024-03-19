import { getTokensPrice, getMultiTokens, getMarkets, getMarketInfo, getGasConfig, getPositions} from '../config/api/api'
import { IPositionsParams } from '../types'; 

/**
 * Represents a module for fetching market data.
 */
export abstract class Markets {
    
    private constructor(){

    }
    
    /**
     * Fetches the gas configuration.
     * @returns The gas configuration data.
     */
    public static async fetchGasConfig(): Promise<any> {
        let { data } = await getGasConfig() as { data: any }
        return data?.data
    }

    /**
     * Fetches the price of market tokens for the given addresses.
     * @param addresses - An array of token addresses.
     * @returns A Promise that resolves to the overviews of the token prices.
     */
    public static async fetchMarketTokensPrice(addresses: string[]): Promise<any> {
        let { data } = await getTokensPrice(addresses) as { data: any }
        return data?.data?.overviews
    }

    /**
     * Fetches market prices for multiple tokens.
     * @param addresses - An array of token addresses.
     * @returns A promise that resolves to the market prices data.
     */
    public static async fetchMarketMultiTokens(addresses: string[]): Promise<any> {
        let { data } = await getMultiTokens(addresses) as { data: any }
        return data?.data?.marketPrices
    }

    /**
     * Fetches the list of markets.
     * @returns {Promise<any[]>} A promise that resolves to an array of market data.
     */
    public static async fetchMarketList(): Promise<any[]> {
        let { data } = await getMarkets() as { data: any }
        return data?.data?.markets
    }

    /**
     * Fetches market information for a given address.
     * @param address - The address of the market.
     * @returns The market information.
     */
    public static async fetchMarketInfo(address: string): Promise<any> {
        let { data } = await getMarketInfo(address) as { data: any }
        return data?.data
    }

    /**
     * Fetches positions based on the provided parameters.
     * @param params - The parameters for fetching positions.
     * @returns A promise that resolves to an array of positions.
     */
    public static async fetchPositions(params: IPositionsParams): Promise<any[]> {
        let { data } = await getPositions(params) as { data: any }
        return data?.data.positions
    }
   
    /**
     * Fetches positions requests by hashes.
     * @param params - The positions parameters.
     * @returns The positions requests by hashes.
     */
    public static async fetchPositionsRequestsByHashes(params: IPositionsParams): Promise<any> {
        let { data } = await getPositions(params) as { data: any }
        return data?.data.requestsByHashes
    }

}