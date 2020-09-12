// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16;
import "./libraries/SafeMath.sol";
import "./libraries/TransferHelper.sol";
import "./interface/IERC20.sol";
import "./interface/IWasabi.sol";
import "./WasabiToken.sol";

interface IMasterChef {
    function pendingSushi(uint256 _pid, address _user)
        external
        view
        returns (uint256);

    function poolLength() external view returns (uint256);
}

contract Offer {
    using SafeMath for uint256;
    //
    enum OfferState {Created, Opened, Taken, Paidback, Expired, Closed}
    address public wasabi;
    address public owner;
    address public taker;
    address public sushi;

    uint8 public state = 0;

    event StateChange(
        uint256 _prev,
        uint256 _curr,
        address from,
        address to,
        address indexed token,
        uint256 indexed amount
    );

    constructor() public {
        wasabi = msg.sender;
    }

    function getState() public view returns (uint256 _state) {
        _state = uint256(state);
    }

    function transferToken(
        address token,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(msg.sender == wasabi, "WASABI OFFER : TRANSFER PERMISSION DENY");
        TransferHelper.safeTransfer(token, to, amount);
    }

    function initialize(
        address _owner,
        address _sushi,
        uint256 sushiPid,
        address tokenIn,
        address masterChef,
        uint256 amountIn
    ) external {
        require(msg.sender == wasabi, "WASABI OFFER : INITIALIZE PERMISSION DENY");
        require(state == 0);
        owner = _owner;
        sushi = _sushi;
        state = 1;
        if (sushiPid != SushiHelper.nullID()) {
            TransferHelper.safeApprove(tokenIn, masterChef, amountIn);
            SushiHelper.deposit(masterChef, sushiPid, amountIn);
        }
    }

    function cancel() public returns (uint256 amount) {
        require(msg.sender == owner, "WASABI OFFER : CANCEL SENDER IS OWNER");
        (uint256 _amount, address _masterChef, uint256 _sushiPid) = IWasabi(
            wasabi
        )
            .offerStatus();
        state = 5;
        if (_sushiPid != SushiHelper.nullID()) {
            SushiHelper.withdraw(_masterChef, _sushiPid, _amount);
        }
        
        IWasabi(wasabi).cancel(msg.sender, sushi, amount);
    }

    function take() external {
        require(state == 1, "WASABI OFFER : TAKE STATE ERROR");
        require(msg.sender != owner, "WASABI OFFER : TAKE SENDER IS OWNER");
        state = 2;
        address tokenAddress = IWasabi(wasabi).tokenAddress();
        uint256 amountWasabi = WasabiToken(tokenAddress).mint(address(this));
        IWasabi(wasabi).take(msg.sender, amountWasabi);
        taker = msg.sender;
    }

    function payback() external {
        require(state == 2, "WASABI: payback");
        state = 3;
        IWasabi(wasabi).payback(msg.sender);

        (uint256 _amount, address _masterChef, uint256 _sushiPid) = IWasabi(
            wasabi
        )
            .offerStatus();

        if (_sushiPid != SushiHelper.nullID()) {
            SushiHelper.withdraw(_masterChef, _sushiPid, _amount);
        }
        uint8 oldState = state;
        state = 5;
        
        IWasabi(wasabi).close(msg.sender, oldState, sushi);
    }

    function close()
        external
        returns (
            address,
            address,
            uint256,
            uint256
        )
    {
        require(state != 5, "WASABI OFFER : TAKE STATE ERROR");
        (uint256 _amount, address _masterChef, uint256 _sushiPid) = IWasabi(
            wasabi
        )
            .offerStatus();
        if (_sushiPid != SushiHelper.nullID()) {
            SushiHelper.withdraw(_masterChef, _sushiPid, _amount);
        }
        uint8 oldState = state;
        state = 5;
        return IWasabi(wasabi).close(msg.sender, oldState, sushi);
    }

    function getEstimatedWasabi() external view returns (uint256 amount) {
        address tokenAddress = IWasabi(wasabi).tokenAddress();
        amount = WasabiToken(tokenAddress).take();
    }

    function getEstimatedSushi() external view returns (uint256 amount) {
        (, address _masterChef, uint256 _sushiPid) = IWasabi(wasabi)
            .offerStatus();
        if(_sushiPid < IMasterChef(_masterChef).poolLength())
        {
            amount = IMasterChef(_masterChef).pendingSushi(
                _sushiPid,
                address(this)
            );    
        }
    }
}
