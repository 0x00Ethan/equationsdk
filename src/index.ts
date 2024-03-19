import BaseProvider from "./providers";
import PositionRouter from "./modules/PositionRouter";
import Approval from "./modules/Approval";
import { Markets } from "./modules/Markets";

declare const window: any;

class EquationSDK {
    providerName: string;
    privateKey: string | undefined;
    wallet: null;
    Web3Provider: any;
    /**
     * Represents the Equation SDK constructor.
     * @constructor
     * @param {string} providerName - The name of the Web3Provider.
     * @param {string} privateKey - The private key.
     */
    constructor(providerName: string, privateKey?: string) {
        this.providerName = providerName;
        this.privateKey = privateKey;
        this.Web3Provider = null;
        this.wallet = null;
        this.connect();
    }

    /**
     * Get the Web3Provider instance.
     * @returns { Web3Provider } The Web3Provider instance.
     */

    get provider() {
        if (typeof window !== 'undefined') {
            this.Web3Provider = new BaseProvider();
            return this.Web3Provider;
        }
    }

    get approval () {
        return new Approval(this.wallet)
    }
    
    /**
     * Get the PositionRouter instance.
     * @returns {PositionRouter} The PositionRouter instance.
     */
    get positionRouter () {
        return new PositionRouter(this.wallet)
    }

    /**
     * Get the Markets instance.
     * @returns {Markets} The Market instance.
     */
    get markets () {
        return Markets;
    }

    /**
     * Connect to the Web3Provider.
     * @returns { Promise<boolean> } A promise that resolves to true if the connection is successful, false otherwise.
     */
    async connect() {
        console.log('this.Web3Provider',this.Web3Provider, this.provider)
        if (this.Web3Provider && this.providerName && !this.privateKey) {
            try {
                this.wallet =  await this.Web3Provider.connect(this.providerName);
            } catch (error) {
                throw new Error("Failed to connect to Web3Provider with providerName.");
            }
        } else if (this.Web3Provider && this.privateKey) {
            try {
                this.wallet = await this.Web3Provider.connect('privateKey', this.privateKey);
            } catch (error) {
                throw new Error(`Failed to connect to Web3Provider with privateKey.${error} ${this.privateKey}` );
            }
        } else {
            throw new Error("Web3Provider is not initialized.");
        }
    }
}

export default EquationSDK