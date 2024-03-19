import { ethers, Wallet } from 'ethers';
import { Provider } from '@ethersproject/providers';
import PositionRouterABI from '../config/abis/PositionRouter.json';
import OrderBookABI from '../config/abis/OrderBook.json';
import RouterABI from '../config/abis/Router.json';
import ERC20ABI from '../config/abis/ERC20.json';
import {CONFIG} from '../config'

/**
 * Creates a contract instance using the provided contract address, ABI, and provider.
 * 
 * @param {string} contract - The contract address.
 * @param {any[]} abi - The contract ABI.
 * @param {ethers.providers.Provider} provider - The provider used to interact with the blockchain.
 * @returns {ethers.Contract | null} - The contract instance or null if either the contract or ABI is missing.
 */
export const getContract = (contract: string, abi: any[], provider:Provider | Wallet) => {
    if (!contract || !abi ) return null;
    return new ethers.Contract(contract, abi, provider);
};

export const getTokenContract = (tokenAddress:string, provider: Wallet) => {
    return getContract(tokenAddress,ERC20ABI,  provider);
};

export const getOrderBookContract = (provider:Provider | Wallet) => {
    return getContract(CONFIG.OrderBook,OrderBookABI,  provider);
};

export const getPositionRouterContract = ( provider:Provider | Wallet) => {
    return getContract(CONFIG.PositionRouter, PositionRouterABI, provider);
};

export const getRouterContract = ( provider:Provider | Wallet) => {
    return getContract(CONFIG.Router,RouterABI, provider);
};

