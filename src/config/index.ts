export * from './enum';
export * from './bignumbers';

export const CONFIG = {
    ChainId:421614,
    ApiURL:"https://api-goldfish-sepolia.metacontract.pro/v1",
    RpcURL:"https://arbitrum-sepolia.blockpi.network/v1/rpc/public",
    BackendHost:"https://api-goldfish-sepolia.metacontract.pro/v1",
    PositionRouter: '0x46bE3DfFDcfbBe3A393d2d66Ee33F28375fc29F5',
    OrderBook: '0xA0A8051160a2C6CcC881e50cF37C8d137b79E5DC',
    Router: '0x6889a9bE8bf089B961811122Ed2813041eC06355',
    USDT: '0x130a10D76E53eC70C2d1c05e9C2EcfB5C3350fe0'
}

export const DEFAULT_PRECISION = 18;

export const DEFAULT_USER_PRECISION = 6;

export const DEFAULT_QUOTE_PRECISION = 6;

export const QUOTE_USD_PRECISION = 6;

export const DEFAULT_SETTING_SLIPPAGE = '0.30';
export const MIN_AUTO_SLIPPAGE_TOLERANCE = DEFAULT_SETTING_SLIPPAGE;
export const MAX_AUTO_SLIPPAGE_TOLERANCE = '25';
export const DEFAULT_QUOTE_AMOUNT = '1000000';





