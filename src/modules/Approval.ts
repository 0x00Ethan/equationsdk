import { getTokenContract, getRouterContract } from '../utils';
import { Contract, Wallet, ethers } from 'ethers';
import { MaxUint256 } from '@ethersproject/constants';
import { CONFIG, DEFAULT_QUOTE_PRECISION } from '../config';
import invariant from 'tiny-invariant';

export default class Approval {
    provider: Wallet;
    tokenAddress: string;
    ApprovalTokenContract: Contract;
    RouterContract: Contract;

    constructor(provider:Wallet) {
        this.provider = provider;
        this.tokenAddress = CONFIG.USDT;
        this.ApprovalTokenContract = getTokenContract(this.tokenAddress, provider);
        this.RouterContract = getRouterContract(provider);
    }

    /**
     * Fetches the allowance amount for the specified spender.
     * @param spender - The contract address of the spender.
     * @returns The formatted allowance amount.
     */
    async fetchAllowance(spender:string) {
        const inputs = [this.provider.address, spender];
        const allowanceAmount = await this.ApprovalTokenContract.allowance(...inputs);
        return ethers.utils.formatUnits(allowanceAmount.toString(), DEFAULT_QUOTE_PRECISION)
    }

    /**
     * Approves the spender to spend tokens on behalf of the contract.
     * @param spender - The contract address of the spender.
     * @returns A Promise that resolves to the result of the approval transaction.
     */
    async approvalToken(spender:string) {
        const res = await this.ApprovalTokenContract.approve(spender, MaxUint256);
    }

    /**
     * Checks if the plugin is approved by the spender.
     * @param spender - The contract address of the spender.
     * @returns A Promise that resolves to the approval status.
     */
    async isPluginApproved(spender:string) {
        const inputs = [this.provider.address, spender] 
        const data = await this.RouterContract.isPluginApproved(...inputs);
        return data;
    }

    /**
     * Approves a plugin for spending tokens.
     * @param spender - The address of the plugin to be approved.
     */
    async approvalPlugin(spender:string) {
        const res = await this.RouterContract.approvePlugin(spender);
    }






}
