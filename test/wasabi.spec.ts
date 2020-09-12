import {expect, use} from 'chai';
import {Contract, BigNumber} from 'ethers';
import {deployContract, MockProvider, solidity} from 'ethereum-waffle';
import Wasabi from '../build/Wasabi.json';
import ERC20 from '../build/ERC20Token.json';
import Offer from '../build/Offer.json'
import WasabiToken from '../build/WasabiToken.json';
import { BigNumber as BN } from 'bignumber.js'
import SushiToken from '../build/SushiToken.json';
import MasterChef from '../build/MasterChef.json';
import WasabiGovernance from '../build/WasabiGovernance.json';

use(solidity);

function convertBigNumber(bnAmount: BigNumber, divider: number) {
	return new BN(bnAmount.toString()).dividedBy(new BN(divider)).toFixed();
}

describe('Wasabi', () => {
	let provider = new MockProvider();
	const [walletMe, walletOther, walletPool, newGovernor, walletTeam, walletA, walletB, walletC] = provider.getWallets();
	let wasabi 		: Contract;
	let tokenUSDT 	: Contract;
	let tokenGL 	: Contract;
	let offer1 		: Contract;
	let pool 		: Contract;
	let wasabiToken : Contract;
	let wasabiGovernance : Contract;

	let sushiToken 	: Contract;
	let masterChef 	: Contract;
	

	async function getBlockNumber() {
		const blockNumber = await provider.getBlockNumber()
		console.log("Current block number: " + blockNumber);
		return blockNumber;
	  }

	before(async () => {

		sushiToken  = await deployContract(walletMe, SushiToken);
		masterChef  = await deployContract(walletMe, MasterChef, [sushiToken.address, walletPool.address, 100, 0, 1000]);

		wasabiToken = await deployContract(walletMe, WasabiToken, [10, 100000000]);
	
		tokenUSDT 	= await deployContract(walletOther, ERC20, ['USDT', 'USDT', 18, 1000000]);
		tokenGL 	= await deployContract(walletMe, ERC20, ['Green Light Planet', 'GL', 18, 1000000]);
		sushiToken  = await deployContract(walletMe, SushiToken);
		masterChef  = await deployContract(walletMe, MasterChef, [sushiToken.address, walletPool.address, 100, provider.blockNumber, 1000]);

		wasabiGovernance = await deployContract(walletMe, WasabiGovernance, []);
		wasabi 		= await deployContract(walletMe, Wasabi, [wasabiGovernance.address, wasabiToken.address, sushiToken.address, 
			masterChef.address, tokenUSDT.address, walletTeam.address], {gasLimit:6000000});
		
		await wasabiGovernance.connect(walletMe).initialize(wasabi.address);
		await tokenGL.connect(walletMe).transfer(walletOther.address, 10000);
		await sushiToken.transferOwnership(masterChef.address);

		// await wasabiToken.connect(walletMe).upgradeImpl(wasabi.address);
		
		console.log('walletMe = ', walletMe.address);
		console.log('walletOther = ', walletOther.address);
		console.log('wasabi address = ', wasabi.address);
		console.log('USDT address = ', tokenUSDT.address);
		console.log('GL address = ', tokenGL.address);
		console.log('pool address = ', wasabiGovernance.address);
	});

	it('Test Dividend', async() => {
		// await wasabiToken.connect(walletMe).increaseProductivity(walletA.address, 1);
		// console.log('A entered', 1);
		// await wasabiToken.connect(walletMe).increaseProductivity(walletB.address, 100);
		// console.log('B entered', 100);

		// console.log('block=', provider.getBlockNumber(), 'A:', convertBigNumber(await wasabiToken.connect(walletMe).takeWithAddress(walletA.address), 1))
		// console.log('block=', provider.getBlockNumber(), 'B:', convertBigNumber(await wasabiToken.connect(walletMe).takeWithAddress(walletB.address), 1))
		// console.log('block=', provider.getBlockNumber(), 'C:', convertBigNumber(await wasabiToken.connect(walletMe).takeWithAddress(walletC.address), 1))

		// await wasabiToken.incNounce();

		// await wasabiToken.connect(walletMe).increaseProductivity(walletC.address, 100);
		// console.log('C entered', 100);

		// console.log('block=', provider.getBlockNumber(), 'A:', convertBigNumber(await wasabiToken.connect(walletMe).takeWithAddress(walletA.address), 1))
		// console.log('block=', provider.getBlockNumber(), 'B:', convertBigNumber(await wasabiToken.connect(walletMe).takeWithAddress(walletB.address), 1))
		// console.log('block=', provider.getBlockNumber(), 'C:', convertBigNumber(await wasabiToken.connect(walletMe).takeWithAddress(walletC.address), 1))

		// await wasabiToken.incNounce();

		// await wasabiToken.connect(walletMe).decreaseProductivity(walletB.address, 100);
		// console.log('B left', 100);

		// console.log('block=', provider.getBlockNumber(), 'A:', convertBigNumber(await wasabiToken.connect(walletMe).takeWithAddress(walletA.address), 1))
		// console.log('block=', provider.getBlockNumber(), 'B:', convertBigNumber(await wasabiToken.connect(walletMe).takeWithAddress(walletB.address), 1))
		// console.log('block=', provider.getBlockNumber(), 'C:', convertBigNumber(await wasabiToken.connect(walletMe).takeWithAddress(walletC.address), 1))

		// await wasabiToken.incNounce();

		// await wasabiToken.connect(walletMe).decreaseProductivity(walletC.address, 100);
		// console.log('C left', 100);

		// console.log('block=', provider.getBlockNumber(), 'A:', convertBigNumber(await wasabiToken.connect(walletMe).takeWithAddress(walletA.address), 1))
		// console.log('block=', provider.getBlockNumber(), 'B:', convertBigNumber(await wasabiToken.connect(walletMe).takeWithAddress(walletB.address), 1))
		// console.log('block=', provider.getBlockNumber(), 'C:', convertBigNumber(await wasabiToken.connect(walletMe).takeWithAddress(walletC.address), 1))

		// await wasabiToken.incNounce();

		// console.log('block=', provider.getBlockNumber(), 'A:', convertBigNumber(await wasabiToken.connect(walletMe).takeWithAddress(walletA.address), 1))
		// console.log('block=', provider.getBlockNumber(), 'B:', convertBigNumber(await wasabiToken.connect(walletMe).takeWithAddress(walletB.address), 1))
		// console.log('block=', provider.getBlockNumber(), 'C:', convertBigNumber(await wasabiToken.connect(walletMe).takeWithAddress(walletC.address), 1))

		await wasabiToken.connect(walletMe).upgradeImpl(wasabi.address);
	});

	it('Deploy Sushi', async() => {
		// await masterChef.connect(walletMe).add(100, tokenUSDT.address, true);
		await masterChef.connect(walletMe).add(100, tokenGL.address, true);
		// await wasabi.connect(walletMe).setSushiPid(tokenUSDT.address, 0);
		await wasabi.connect(walletMe).setSushiPid(tokenGL.address, 0);
		await tokenGL.connect(walletOther).approve(masterChef.address, 999999999999999);
		await masterChef.connect(walletOther).deposit(0, 10000);
		await masterChef.connect(walletOther).withdraw(0, 10000);
		// console.log(convertBigNumber(await wasabiToken.balanceOf(walletOther.address), 1));
	});


	it('Create Offer fail', async () => {
		let blockNumber = await getBlockNumber();
		await wasabi.connect(walletMe).setStartBlock(blockNumber+10);

		await tokenGL.connect(walletMe).approve(wasabi.address, 999999999999999);
		// await expect(wasabi.connect(walletMe).createOffer(
		// 	tokenGL.address, tokenUSDT.address, 10000, 1000, 6500*30, 20, 0)).to.be.revertedWith("WASABI: INVALID TOKEN");
		await expect(wasabi.connect(walletMe).createOffer(
			[tokenGL.address, tokenUSDT.address], [10000, 1000, 6500*30, 20])).to.be.revertedWith("WASABI: INVALID TOKEN");

		await wasabi.connect(walletMe).setPoolShare(tokenGL.address, 1);

		await expect(wasabi.connect(walletMe).createOffer([tokenGL.address, tokenUSDT.address], [10000, 1000, 6500*30, 20])).to.be.revertedWith('WASABI: NOT READY')

	});

	it('Create Offer', async () => {
		let blockNumber = await getBlockNumber();
		await wasabi.connect(walletMe).setStartBlock(blockNumber-10);
		await wasabi.connect(walletMe).setPoolShare(tokenGL.address, 1);
		let tx = await wasabi.connect(walletMe).createOffer([tokenGL.address, tokenUSDT.address], [10000, 1000, 6500*30, 20]);
		let receipt = await tx.wait();

		for (let event of receipt.events) {
			if ('OfferCreated' === event.event) {
				let offerAddress = '0x' + event.topics[3].slice(-40);
				console.log('offer1 address = ', offerAddress);
				offer1 = new Contract(offerAddress, Offer.abi, provider);
				expect(convertBigNumber(await tokenGL.balanceOf(offer1.address), 1)).to.equals('0');
				expect(convertBigNumber(await tokenGL.balanceOf(masterChef.address), 1)).to.equals('10000');
			} 
		}
	});

	it('Cancel Offer', async() =>{
		expect(convertBigNumber(await tokenGL.balanceOf(walletMe.address), 1)).to.equals('980000');
		await offer1.connect(walletMe).cancel();
		expect(convertBigNumber(await tokenGL.balanceOf(walletMe.address), 1)).to.equals('990000');
		expect(convertBigNumber(await wasabiToken.balanceOf(walletMe.address), 1)).to.equals('9');
		expect(convertBigNumber(await sushiToken.balanceOf(walletMe.address), 1)).to.equals('1000');
		expect(convertBigNumber(await tokenGL.balanceOf(masterChef.address), 1)).to.equals('0');
		let tx = await wasabi.connect(walletMe).createOffer([tokenGL.address, tokenUSDT.address], [10000, 1000, 6500*30, 20]);
		let receipt = await tx.wait();

		for (let event of receipt.events) {
			if ('OfferCreated' === event.event) {
				let offerAddress = '0x' + event.topics[3].slice(-40);
				console.log('offer1 address = ', offerAddress);
				offer1 = new Contract(offerAddress, Offer.abi, provider);
				expect(convertBigNumber(await tokenGL.balanceOf(offer1.address), 1)).to.equals('0');
				expect(convertBigNumber(await tokenGL.balanceOf(masterChef.address), 1)).to.equals('10000');
			} 
		}
		expect(convertBigNumber(await tokenGL.balanceOf(masterChef.address), 1)).to.equals('10000');
	});

	it('Get Offer', async () => {
		// let offerList = (await wasabi.connect(walletOther).getAvailableOffers(tokenGL.address, {gasLimit:5000000})).filter(function(v:any, i: number, arr:any[] ) { 
			// return v != '0x0000000000000000000000000000000000000000'
		// });
		// expect(offerList.length).to.equals(2);
		await tokenUSDT.connect(walletOther).approve(wasabi.address, 999999999999999);
		console.log(await convertBigNumber(offer1.getEstimatedWasabi(), 1));
		console.log(await convertBigNumber(offer1.getEstimatedSushi(), 1));
		// await expect(offer1.connect(walletMe).take({gasLimit:5000000})).to.be.revertedWith("You can't take your own offer.");
		let tx = await offer1.connect(walletOther).take({gasLimit:5000000});
		let receipt = await tx.wait();
		for(let event of receipt.events) {
			if('StateChange' === event.event)
			{
				console.log('State Changed from', convertBigNumber(event.args[0], 1), 'to', convertBigNumber(event.args[1], 1), 'with', 
					event.args[2], 'transfered', convertBigNumber(event.args[5], 1), '(', event.args[4], ')', 'to', event.args[3]);
				expect(convertBigNumber(event.args[0], 1)).to.equals('1');
				expect(convertBigNumber(event.args[1], 1)).to.equals('2');
				expect(event.args[4]).to.equals(tokenUSDT.address);
				// expect(convertBigNumber(event.args[5], 1)).to.equals('1000');
			}
		}
		// console.log('6')
		expect(convertBigNumber(await tokenUSDT.balanceOf(wasabiGovernance.address), 1)).to.equals('12');
		expect(convertBigNumber(await tokenUSDT.balanceOf(walletMe.address), 1)).to.equals('970');
		// console.log(convertBigNumber(await wasabiToken.balanceOf(walletMe.address), 1));
		await wasabiToken.incNounce();
		expect(convertBigNumber(await wasabiToken.balanceOf(walletMe.address), 1)).to.equals('27');

		// expect(offerList.length).to.equals(2);
	});


	it('Take Offer', async () => {
		expect(convertBigNumber(await offer1.getState(), 1)).to.equals('2');
		expect(convertBigNumber(await tokenUSDT.balanceOf(offer1.address), 1)).to.equals('18');
		expect(convertBigNumber(await tokenGL.balanceOf(offer1.address), 1)).to.equals('0');

		// await expect(offer1.connect(walletOther).take()).to.be.revertedWith("You can't take at this state.");
		// await expect(offer1.connect(walletMe).take()).to.be.revertedWith("You can't take at this state.");
	});

	it('Payback Offer', async() => {
		// await expect(offer1.connect(walletOther).payback()).to.be.revertedWith("You are not the owner of the offer.");		
		// await expect(offer1.connect(walletMe).payback()).to.be.revertedWith("TransferHelper: TRANSFER_FROM_FAILED");

		await tokenUSDT.connect(walletMe).approve(wasabi.address, 999999999999999);
		await tokenUSDT.connect(walletOther).transfer(walletMe.address, 30);

		let tx = await offer1.connect(walletMe).payback();
		let receipt = await tx.wait();
		for(let event of receipt.events){
			if('StateChange' === event.event)
			{
				console.log('State Changed from', convertBigNumber(event.args[0], 1), 'to', convertBigNumber(event.args[1], 1), 'with', 
					event.args[2], 'transfered', convertBigNumber(event.args[5], 1), '(', event.args[4], ')', 'to', event.args[3]);
				expect(convertBigNumber(event.args[0], 1)).to.equals('2');
				expect(convertBigNumber(event.args[1], 1)).to.equals('3');
				expect(event.args[4]).to.equals(tokenUSDT.address);
				expect(convertBigNumber(event.args[5], 1)).to.equals('1000');
			}
		}

		expect(convertBigNumber(await tokenUSDT.balanceOf(offer1.address), 1)).to.equals('0');
		expect(convertBigNumber(await tokenGL.balanceOf(offer1.address), 1)).to.equals('0');

		// await expect(offer1.connect(walletMe).payback()).to.be.revertedWith("You can't payback at this state.");
		// await expect(offer2.connect(walletOther).payback()).to.be.revertedWith("You can't payback at this state.");
		// await expect(offer2.connect(walletMe).payback()).to.be.revertedWith("You can't payback at this state.");
	});

	it('Clear Offer', async() => {

		await expect(offer1.connect(walletMe).close()).to.be.revertedWith("WASABI OFFER : TAKE STATE ERROR");
		// let tx = await offer1.connect(walletMe).close();
		// let receipt = await tx.wait();
		// for(let event of receipt.events){
		// 	if('StateChange' === event.event)
		// 	{
		// 		console.log('State Changed from', convertBigNumber(event.args[0], 1), 'to', convertBigNumber(event.args[1], 1), 'with', 
		// 			event.args[2], 'transfered', convertBigNumber(event.args[5], 1), '(', event.args[4], ')', 'to', event.args[3]);
		// 	}
		// }

		expect(convertBigNumber(await tokenUSDT.balanceOf(offer1.address), 1)).to.equals('0');
		expect(convertBigNumber(await tokenGL.balanceOf(offer1.address), 1)).to.equals('0');
		expect(convertBigNumber(await wasabiToken.balanceOf(offer1.address), 1)).to.equals('0');
		expect(convertBigNumber(await sushiToken.balanceOf(offer1.address), 1)).to.equals('0');

		console.log('my wasabi:', convertBigNumber(await wasabiToken.balanceOf(walletMe.address), 1));
		console.log('my sushi:', convertBigNumber(await sushiToken.balanceOf(walletMe.address), 1));

		console.log('team team:', convertBigNumber(await wasabiToken.balanceOf(walletTeam.address), 1));
	});


	it('Governance', async() => {
		let balance = await tokenUSDT.balanceOf(wasabiGovernance.address);
		console.log('Governance USDT:', convertBigNumber(balance, 1), balance)

		let balance2 = await wasabiToken.balanceOf(wasabiGovernance.address);
		console.log('Governance WASABI:', convertBigNumber(balance, 1), balance2)

		await wasabiGovernance.connect(walletMe).changeRewardManager(newGovernor.address);

		balance = await tokenUSDT.balanceOf(wasabiGovernance.address);
		balance2 = await wasabiToken.balanceOf(wasabiGovernance.address);

		console.log('new Governance USDT:', convertBigNumber(balance, 1), balance)
		expect(convertBigNumber(balance, 1)).to.equals('0');
		
		console.log('Governance WASABI:', convertBigNumber(balance2, 1), balance2)
		expect(convertBigNumber(balance2, 1)).to.equals('0');

		balance = await tokenUSDT.balanceOf(newGovernor.address);
		expect(convertBigNumber(balance, 1)).to.equals('12');

		// balance2 = await wasabiToken.balanceOf(newGovernor.address);
		// expect(convertBigNumber(balance2, 1)).to.equals('3');
	});
});