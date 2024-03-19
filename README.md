# Equation SDK

🛠 An SDK for building applications on top of Equation.

## Installing

```
yarn add equation-sdk

//import equation-sdk.js to public/index.html through script src
<script src=`${yourpath}/dist/equation-sdk.cjs.production.min.js``></script>
```
## Code
```
import {useCallback} from 'react'
import EQUSDK from 'equation-sdk'
const yourPrivateKey = ''
const marketETH = ''
const equSDK = new EQUSDK('privateKey', yourPrivateKey) 

// Create open or increase the size of existing position request
const onCreateIncreasePosition = useCallback(async()=>{
     const result = await sdk.positionRouter.createIncreasePosition(
        marketETH,
        1,
        '100',
        '0.2',
    )
},[])

// Fetches the list of markets.
const onCreateIncreasePosition = async() => {
     const marketList = await sdk.markets.fetchMarketList();
     return marketList
}
return <>
    {your code}
</>

```

## Support method list

### equSDK.markets
1. fetchMarketList
2. fetchPositions
3. fetchPositionsRequestsByHashes
4. fetchGasConfig
5. fetchMarketTokensPrice
6. fetchMarketMultiTokens


### equSDK.positionRouter
1. approvalPosition
2. createIncreasePosition
3. createDecreasePosition

### equSDK.approval
1. fetchAllowance
2. approvalToken
3. isPluginApproved
4. approvalPlugin

## Example
src/tests


## License
MIT License

Copyright (c) 2024 EquationDao

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

