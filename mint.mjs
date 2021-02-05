import path from "path"
import fs from "fs"

import {
  constructMediaData,
  sha256FromBuffer,
  generateMetadata,
  constructBidShares,
  Zora
} from "@zoralabs/zdk"

import ethers, { Wallet, BigNumber } from "ethers"

const startMinting = async () => {
  // setup eth provider (using Etherscan for this test)
  // need a Etherscan API key, but can use other providers.
  // reference ethers docs for more info. 
  const provider = new ethers.providers.EtherscanProvider(
    "homestead", /* (mainnet) */
    "_etherscan_api_key_"
  )
  
  // instance eth wallet, can use private key but here i'm
  // accessing the wallet through mnemonic phrase.
  // then connect to the etherscan provider.
  const wallet = new Wallet.fromMnemonic("_mnemonic_phrase_").connect(provider)

  // get balance + get gas price
  // need to convert BigNumber to readable int
  // const gas = await wallet.getGasPrice()
  // const gasVal = BigNumber.from(gas._hex).toNumber() /*not working*/
  // const balance = await wallet.getBalance()
  // const balanceVal = BigNumber.from(balance._hex).toNumber() /* -- */
 

  // instance zora with wallet. the following steps are from Zora docs
  // 1 = mainnet
  const zora = new Zora(wallet, 1);
  const metadataJSON = generateMetadata("zora-20210101", {
    description:
      "Strolling through the Cloud with the Shoes of a Tsar made of Gold and Sugar",
    mimeType: "video/mp4",
    name: "Hakone mountains, some time ago again",
    version: "zora-20210101",
  });

  // local file
  const contentHash = sha256FromBuffer(bufferFromFile("videos/sssss.mp4"));
  // uploaded file that's downloaded again to confirm comparison
  const contentHashCompare = sha256FromBuffer(
    bufferFromFile("videos/6eca82ff20c9629cf1a17d96b1c1c8a3.mpg4")
  );

  const metadataHash = sha256FromBuffer(Buffer.from(metadataJSON));
  // manu
  const metadataHashCompare = sha256FromBuffer(
    bufferFromFile("json/mint.json")
  );

  // currently downloading these files to compare locally
  const mediaData = constructMediaData(
    "https://arena-attachments.s3.amazonaws.com/10602187/6eca82ff20c9629cf1a17d96b1c1c8a3.mpg4?1612489030",
    "https://1234.56.digital/mint/mint1.json",
    contentHash,
    metadataHash
  );

  // manual compare LOL
  const contentCompareCheck = contentHash == contentHashCompare;
  console.log(contentCompareCheck, "media data matches");

  // will test to see if we need to compare the meta data
  // const metadataCompareCheck = metadataHash == metadataHashCompare;
  // console.log(metadataCompareCheck, "meta data matches");

  if (contentCompareCheck) {
    console.log("media hashses match, going to mint");
    const bidShares = constructBidShares(
      30, // creator share
      70, // owner share
      0 // prevOwner share
    );
    const tx = await zora.mint(mediaData, bidShares);
    await tx.wait(8); // 8 confirmations to finalize

    console.log("sent to wallet!")

  } else {
    console.log("media didnt match");
  }
}

// little util to convert file to buffer (need to test this further)

function bufferFromFile(relPath) {
  const __dirname = path.resolve(path.dirname(""));
  return fs.readFileSync(path.join(__dirname, relPath)); // zzzz....
}

startMinting()