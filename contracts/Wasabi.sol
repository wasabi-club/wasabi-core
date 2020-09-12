// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16;
import './interface/IERC20.sol';
import './WasabiToken.sol';
import './WasabiOffer.sol';
import './libraries/TransferHelper.sol';

contract Wasabi is UpgradableGovernance
{
    using SafeMath for uint;
    address public rewardAddress;
    address public tokenAddress;
    address public sushiAddress;
    address public teamAddress;
    address public masterChef;
    address public acceptToken;
    bytes32 public contractCodeHash;
    mapping(address => address[]) public allOffers;
    uint public feeRate;
    uint public interestRate;
    uint public startBlock;

    struct SushiStruct {
        uint val;
        bool isValid;
    }
    
    mapping(address => uint) public offerStats;
    mapping(address => address[]) public userOffers;
    mapping(address => uint) public pool;
    mapping(address => address[]) public takerOffers;
    mapping(address => SushiStruct) public sushiPids;
    address[] public tokens;
  
    struct OfferStruct {
        address tokenIn;
        address tokenOut;
        uint amountIn;
        uint amountOut;
        uint expire;
        uint interests;
        uint duration;
        uint feeRate;
        uint interestrate;
        address owner;
        address taker;
        address masterChef;
        uint sushiPid;
        uint productivity;
    }
    
    mapping(address => OfferStruct) public offers;

    function setPoolShare(address _token, uint _share) requireGovernor public {
        if (pool[_token] == 0) {
            tokens.push(_token);
        }
        pool[_token] = _share;
    }

    function setTeamAddress(address _newAddress) requireGovernor public {
        teamAddress = _newAddress;
    }

    function getTokens() external view returns (address[] memory) {
        return tokens;
    }

    function getTokensLength() external view returns (uint) {
        return tokens.length;
    }

    function setFeeRate(uint _feeRate) requireGovernor public  {
        feeRate = _feeRate;
    }

    function setInterestRate(uint _interestRate) requireGovernor public  {
        interestRate = _interestRate;
    }

    function setStartBlock(uint _startBlock) requireGovernor public  {
        startBlock = _startBlock;
    }

    function setSushiPid(address _token, uint _pid) requireGovernor public  {
        sushiPids[_token].val = _pid;
        sushiPids[_token].isValid = true;
    }

    function getRateForOffer(address _offer) external view returns (uint offerFeeRate, uint offerInterestrate) {
        OfferStruct memory offer = offers[_offer];
        offerFeeRate = offer.feeRate;
        offerInterestrate = offer.interestrate;
    }

    event OfferCreated(address indexed _tokenIn, address indexed _tokenOut, uint _amountIn, uint _amountOut, uint _duration, uint _interests, address indexed _offer);
    event OfferChanged(address indexed _offer, uint _state);

    constructor(address _rewardAddress, address _wasabiTokenAddress, address _sushiAddress, address _masterChef, address _acceptToken, address _teamAddress) public  {
        rewardAddress = _rewardAddress;
        teamAddress = _teamAddress;
        tokenAddress = _wasabiTokenAddress;
        sushiAddress = _sushiAddress;
        masterChef = _masterChef;
        feeRate = 100;
        interestRate = 1000;
        acceptToken = _acceptToken;
    }

    function createOffer(
        address[2] memory _addrs,
        uint[4] memory _uints) public returns(address offer, uint productivity) 
    {
        require(_addrs[0] != _addrs[1],     "WASABI: INVALID TOKEN IN&OUT");
        require(_uints[3] < _uints[1],      "WASABI: INVALID INTERESTS");
        require(pool[_addrs[0]] > 0,        "WASABI: INVALID TOKEN");
        require(_uints[1] > 0,              "WASABI: INVALID AMOUNT OUT");
        // require(_tokenOut == 0xdAC17F958D2ee523a2206206994597C13D831ec7, "only support USDT by now.");
        require(_addrs[1] == acceptToken, "WASABI: ONLY USDT SUPPORTED");
        require(block.number >= startBlock, "WASABI: NOT READY");

        bytes memory bytecode = type(Offer).creationCode;
        if (uint(contractCodeHash) == 0) {
            contractCodeHash = keccak256(bytecode);
        }
        bytes32 salt = keccak256(abi.encodePacked(msg.sender, _addrs[0], _addrs[1], _uints[0], _uints[1], _uints[2], _uints[3], block.number));
        assembly {
            offer := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        productivity = pool[_addrs[0]] * _uints[0];
        uint sushiPid = sushiPids[_addrs[0]].isValid ? sushiPids[_addrs[0]].val : SushiHelper.nullID();

        offers[offer] = OfferStruct({
            productivity:productivity,
            tokenIn: _addrs[0],
            tokenOut: _addrs[1],
            amountIn: _uints[0],
            amountOut :_uints[1],
            expire :0,
            interests:_uints[3],
            duration:_uints[2],
            feeRate:feeRate,
            interestrate:interestRate,
            owner:msg.sender,
            taker:address(0),
            masterChef:masterChef,
            sushiPid:sushiPid
        });
        WasabiToken(tokenAddress).increaseProductivity(offer, productivity);
        TransferHelper.safeTransferFrom(_addrs[0], msg.sender, offer, _uints[0]);
        offerStats[offer] = 1;
        Offer(offer).initialize(msg.sender, sushiAddress, sushiPid, _addrs[0], masterChef, _uints[0]);
        
        allOffers[_addrs[0]].push(offer);
    
        userOffers[msg.sender].push(offer);

        emit OfferCreated(_addrs[0], _addrs[1], _uints[0], _uints[1], _uints[2], _uints[3], offer);
    }
    
    function cancel(address _from, address sushi, uint amountWasabi) external {
        require(offerStats[msg.sender] != 0, "WASABI: CANCEL OFFER NOT FOUND");
        OfferStruct storage offer = offers[msg.sender];

        // send mined WASABI to owner.
        if (offer.productivity > 0) {
            amountWasabi = WasabiToken(tokenAddress).decreaseProductivity(msg.sender, offer.productivity);
            uint amountWasabiTeam = amountWasabi.mul(1).div(10);
            Offer(msg.sender).transferToken(tokenAddress, teamAddress, amountWasabiTeam);
            Offer(msg.sender).transferToken(tokenAddress, offer.owner, amountWasabi - amountWasabiTeam);
        }

        // send mined SUSHI to owner.
        if(offer.sushiPid != SushiHelper.nullID()) {
            Offer(msg.sender).transferToken(sushi,_from, IERC20(sushi).balanceOf(msg.sender));
        }

        // send collateral to owner.
        Offer(msg.sender).transferToken(offer.tokenIn, offer.owner, offer.amountIn);
        
        OfferChanged(msg.sender, Offer(msg.sender).state());
    }
    
    function take(address _from, uint amountWasabi) external {
        require(offerStats[msg.sender] != 0, "WASABI: TAKE OFFER NOT FOUND");
        OfferStruct storage offer = offers[msg.sender];
        offer.taker = _from;
        offer.expire = offer.duration.add(block.number);

        // send fees to reward address.
        uint platformFee = offer.amountOut.mul(offer.feeRate).div(10000); 
        uint feeAmount = platformFee.add(offer.interests.mul(offer.interestrate).div(10000)); 
        TransferHelper.safeTransferFrom(offer.tokenOut, _from, rewardAddress, feeAmount);
        
        // send lend money to owner.
        uint amountToOwner = offer.amountOut.sub(offer.interests.add(platformFee));
        TransferHelper.safeTransferFrom(offer.tokenOut, _from, offer.owner, amountToOwner); 
        
        // send the rest the the contract.
        TransferHelper.safeTransferFrom(offer.tokenOut, _from, msg.sender, offer.amountOut.sub(amountToOwner).sub(feeAmount));        

        // mint WASABI to the owner and cut 1/10 to the reward address.
        if (offer.productivity > 0) {
            amountWasabi = WasabiToken(tokenAddress).decreaseProductivity(msg.sender, offer.productivity);
            uint amountWasabiTeam = amountWasabi.mul(1).div(10);
            Offer(msg.sender).transferToken(tokenAddress, teamAddress, amountWasabiTeam);
            Offer(msg.sender).transferToken(tokenAddress, offer.owner, amountWasabi - amountWasabiTeam);
        }
        
        addTakerOffer(msg.sender, _from);
        OfferChanged(msg.sender, Offer(msg.sender).state());
    }
    

    function payback(address _from) external {
        require(offerStats[msg.sender] != 0, "WASABI: PAYBACK OFFER NOT FOUND");
        OfferStruct storage offer = offers[msg.sender];
        TransferHelper.safeTransferFrom(offer.tokenOut, _from, msg.sender, offer.amountOut);
        OfferChanged(msg.sender, Offer(msg.sender).state());
    }
    
    function close(address _from, uint8 _state, address sushi) external returns (address tokenToOwner, address tokenToTaker, uint amountToOwner, uint amountToTaker) {
        require(offerStats[msg.sender] != 0, "WASABI: CLOSE OFFER NOT FOUND");
        OfferStruct storage offer = offers[msg.sender];
        require(_state == 3 || block.number >= offer.expire, "WASABI: INVALID STATE");
        require(_from == offer.owner || _from == offer.taker, "WASABI: INVALID CALLEE");

        // if paid back.
        if(_state == 3) {
            amountToTaker = offer.amountOut.add(offer.interests.sub(offer.interests.mul(offer.interestrate).div(10000)));
            tokenToTaker = offer.tokenOut;
            Offer(msg.sender).transferToken(tokenToTaker,  offer.taker, amountToTaker);
            amountToOwner = offer.amountIn;
            tokenToOwner = offer.tokenIn;
            Offer(msg.sender).transferToken(tokenToOwner, offer.owner, amountToOwner);
            if(offer.sushiPid != SushiHelper.nullID())
                Offer(msg.sender).transferToken(sushi, offer.owner, IERC20(sushi).balanceOf(msg.sender));
        }
        // deal with if the offer expired.
        else if(block.number >= offer.expire) {
            amountToTaker = offer.amountIn;
            tokenToTaker = offer.tokenIn;
            Offer(msg.sender).transferToken(tokenToTaker, offer.taker, amountToTaker);

            uint  amountRest = IERC20(offer.tokenOut).balanceOf(msg.sender);
            Offer(msg.sender).transferToken(offer.tokenOut, offer.taker, amountRest);
            if(offer.sushiPid != SushiHelper.nullID())
                Offer(msg.sender).transferToken(sushi, offer.taker, IERC20(sushi).balanceOf(msg.sender));
        }
        OfferChanged(msg.sender, Offer(msg.sender).state());
    }
    
    function offerStatus() external view returns(uint amountIn, address _masterChef, uint sushiPid) {
        OfferStruct storage offer = offers[msg.sender];
        amountIn = offer.amountIn;
        _masterChef = offer.masterChef;
        sushiPid = offer.sushiPid;
    }
    
 
    function  getOffer(address  _lpToken,  uint index) external view returns (address offer) {
        offer = allOffers[_lpToken][index];
    }

    function getOfferLength(address _lpToken) external view returns (uint length) {
        length = allOffers[_lpToken].length;
    }

    function getUserOffer(address _user, uint _index) external view returns (address) {
        return userOffers[_user][_index];
    }

    function getUserOffersLength(address _user) external view returns (uint length) {
        length = userOffers[_user].length;
    }

    function addTakerOffer(address _offer, address _user) public returns (uint) {
        require(msg.sender == _offer, 'WASABI: FORBIDDEN');
        takerOffers[_user].push(_offer);
        return takerOffers[_user].length;
    }

    function getTakerOffer(address _user, uint _index) external view returns (address) {
        return takerOffers[_user][_index];
    }

    function getTakerOffersLength(address _user) external view returns (uint length) {
        length = takerOffers[_user].length;
    }
}

