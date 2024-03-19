/**
 * Represents a Web3Provider.
 */

import { ethers } from "ethers";
import { CONFIG } from "../config";

declare global {
  interface Window {
    ethereum?: any;
    okxwallet?: any;
    bybitWallet?: any;
    bitkeep?: any;
    
  }
}

export default class Web3Provider {
  supportedProviderList: { okx: any; bybit: any; bitkeep: any; injected: any; privateKey: string; };

    constructor () {
      globalThis.ethereum = globalThis?.ethereum || {}
      this.supportedProviderList = {
        okx: globalThis?.okxwallet,
        bybit: globalThis?.bybitWallet,
        bitkeep:globalThis?.bitkeep?.ethereum,
        injected: globalThis.ethereum,
        privateKey:'privateKey'
      }
    }

    /**
     * Retrieves the provider from the window object.
     * @returns {Object} The provider object.
     */
    getProvider () {
        return  globalThis.ethereum
    }

    /**
   * Connects to the Web3Provider based on the provided provider name.
   * @param {string} providerName - The name of the provider.
   * @param {string} [privateKey] - Private key.
   * @returns {<string>} - Create a new Web3Provider.
   * @throws {Error} - Throws an error if the provider is not supported.
   */
  async connect (providerName: string, privateKey = null) {
    const supportProviderNames = Object.keys(this.supportedProviderList).join(',')
    if (!supportProviderNames.includes(providerName)) {
      throw new Error(`Provider not supported,only support ${supportProviderNames} now`)
    }
    if (!this.supportedProviderList[providerName]) {
      throw new Error(`No ${providerName} provider found`)
    }
    if (providerName === 'privateKey' && privateKey) {
        const providerArb = new ethers.providers.JsonRpcProvider(CONFIG.RpcURL)
        return new ethers.Wallet(privateKey, providerArb)
    }else {
      return new ethers.providers.Web3Provider(this.supportedProviderList[providerName]).getSigner()
    }
  }
}


