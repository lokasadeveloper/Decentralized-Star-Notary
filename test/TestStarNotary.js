const StarNotary = artifacts.require("StarNotary");
const { toBN } = web3.utils;

var accounts;
var owner;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

describe( 'Test Group 1 - Contract Functions', function () {
    this.timeout( 30000 );
    
    it('TestCase1: can Create a Star', async() => {
        let tokenId = 1;
        let instance = await StarNotary.deployed();
        await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]})
        assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star!')
    });

    it('TestCase2: lets user1 put up their star for sale', async() => {
        let instance = await StarNotary.deployed();
        let user1 = accounts[1];
        let starId = 2;
        let starPrice = web3.utils.toWei(".01", "ether");

        await instance.createStar('awesome star', starId, {from: user1});
        await instance.putStarUpForSale(starId, starPrice, {from: user1});

        assert.equal(await instance.starsForSale.call(starId), starPrice);
    });

    it('TestCase3: lets user1 get the funds after the sale', async() => {
        let instance = await StarNotary.deployed();
        let user1 = accounts[1];
        let user2 = accounts[2];
        let starId = 3;
        let starPrice = web3.utils.toWei(".01", "ether");
        let balance = web3.utils.toWei(".05", "ether");
        await instance.createStar('awesome star', starId, {from: user1});
        await instance.putStarUpForSale(starId, starPrice, {from: user1});
        let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
        await instance.buyStar(starId, {from: user2, value: balance});
        let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
        let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
        let value2 = Number(balanceOfUser1AfterTransaction);
        assert.equal(value1, value2);
    });

    it('TestCase4: lets user2 buy a star, if it is put up for sale', async() => {
        let instance = await StarNotary.deployed();
        let user1 = accounts[1];
        let user2 = accounts[2];
        let starId = 4;
        let starPrice = web3.utils.toWei(".01", "ether");
        let balance = web3.utils.toWei(".05", "ether");
        await instance.createStar('awesome star', starId, {from: user1});
        await instance.putStarUpForSale(starId, starPrice, {from: user1});
        let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
        await instance.buyStar(starId, {from: user2, value: balance});
        assert.equal(await instance.ownerOf.call(starId), user2);
    });

    it('TestCase5: lets user2 buy a star and decreases its balance in ether', async() => {
        let instance = await StarNotary.deployed();
        let user1 = accounts[1];
        let user2 = accounts[2];
        let starId = 5;
        let starPrice = web3.utils.toWei(".01", "ether");
        let balance = web3.utils.toWei(".05", "ether");
        await instance.createStar('awesome star', starId, {from: user1});
        await instance.putStarUpForSale(starId, starPrice, {from: user1});
        
        const balanceBeforeTx = await web3.eth.getBalance(user2);
        const bignumBalanceBeforeTx = toBN(balanceBeforeTx);
        const receipt = await instance.buyStar(starId, {from: user2, value: balance}); //gasPrice:0
        const bignumGasUsed = toBN(receipt.receipt.gasUsed);
        //console.log(`GasUsed: ${receipt.receipt.gasUsed}`);

        // Obtain gasPrice from the transaction
        const tx = await web3.eth.getTransaction(receipt.tx);
        const bignumGasPrice = toBN(tx.gasPrice);
        //console.log(`GasPrice: ${tx.gasPrice}`);
        
        const balanceAfterTx = await web3.eth.getBalance(user2);
        const bignumBalanceAfterTx = toBN(balanceAfterTx);

        assert.equal
        (     
            //CHECK: ((Initial_balance) - (Balance_after_buy_Star + (GasPrice*GasUsed))) MUST_EQUAL_TO Star's price       
            bignumBalanceBeforeTx.sub( bignumBalanceAfterTx.add( bignumGasPrice.mul(bignumGasUsed) ) ).toString(),           
            starPrice.toString()            
        );

    });

    // Implement Task 2 Add supporting unit tests

    it('TestCase6: can add the star name and star symbol properly', async() => {
        // 1. create a Star with different tokenId
        //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided

        let nftName = "Crypto Lucky Star";
        let nftSymbol = "CLSTAR";
        
        let instance = await StarNotary.deployed();
        let user1 = accounts[1];
        let starId = 6;
        await instance.createStar('awesome star', starId, {from: user1});

        const name = await instance.methods['name()']();
        //console.log(`NFT name: ${name}`);

        const symbol = await instance.methods['symbol()']();
        //console.log(`NFT symbol: ${symbol}`);

        assert.equal(nftName, name);
        assert.equal(nftSymbol, symbol);

    });

    it('TestCase7: lets 2 users exchange stars', async() => {
        // 1. create 2 Stars with different tokenId
        // 2. Call the exchangeStars functions implemented in the Smart Contract
        // 3. Verify that the owners changed
        let instance = await StarNotary.deployed();
        let user1 = accounts[1];
        let user2 = accounts[2];
        let starId_7 = 7;        
        let starId_8 = 8;

        const star7_name = 'star 7';
        const star8_name = 'star 8';
        await instance.createStar(star7_name, starId_7, {from: user1});        
        await instance.createStar(star8_name, starId_8, {from: user2});

        await instance.exchangeStars(starId_7, starId_8, {from: user1});

        const star7 = await instance.lookUptokenIdToStarInfo(starId_7);
        //console.log(`Star 7: ${star7}`);

        assert.equal(star7_name, star7);

        const star8 = await instance.lookUptokenIdToStarInfo(starId_8);
        //console.log(`Star 8: ${star8}`);

        assert.equal(star8_name, star8);


    });

    it('TestCase8: lets a user transfer a star', async() => {
        // 1. create a Star with different tokenId
        // 2. use the transferStar function implemented in the Smart Contract
        // 3. Verify the star owner changed.

        let instance = await StarNotary.deployed();
        let user1 = accounts[1];
        let user2 = accounts[2];
        let starId = 9;

        await instance.createStar("Star 9", starId, {from: user1});     
        await instance.transferStar(user2, starId, {from: user1});

        const tokenOwner = await instance.ownerOf.call(starId)
        //console.log(`token owner: ${tokenOwner}`);

        assert.equal(user2, tokenOwner);

    });

    it('TestCase9: lookUptokenIdToStarInfo test', async() => {
        // 1. create a Star with different tokenId
        // 2. Call your method lookUptokenIdToStarInfo
        // 3. Verify if you Star name is the same

        const starName = 'Little Twinkle Star';

        let instance = await StarNotary.deployed();
        let user1 = accounts[1];
        let starId = 10;
        
        await instance.createStar(starName, starId, {from: user1});
        const starInfo = await instance.lookUptokenIdToStarInfo(starId);
        //console.log(`Star info: ${starInfo}`);

        assert.equal(starName, starInfo);
    });

});


describe( 'Test Group 2 - Contract Events', function () {
    this.timeout( 30000 );

    it('TestCase1: check emitted event after call putStarUpForSale', async() => {
        let instance = await StarNotary.deployed();
        let user1 = accounts[1];
        let starId = 11;
        let starPrice = web3.utils.toWei(".01", "ether");

        await instance.createStar('awesome star', starId, {from: user1});
        
        const tx = await instance.putStarUpForSale(starId, starPrice, {from: user1});
        
        const { logs } = tx;
        assert.ok(Array.isArray(logs));
        assert.equal(logs.length, 1);
        const log = logs[0];
        //console.log(log);
        //console.log(log.args.tokenId.toString());
        //console.log(log.args.price.toString());
        assert.equal(log.event, 'StarForSale');
        assert.equal(log.args.tokenId.toString(), starId);
        assert.equal(log.args.price.toString(), starPrice);
    });
});