// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {Koin} from "../src/Koin.sol";
import {SimStock} from "../src/SimStock.sol";
import {SimOracle} from "../src/SimOracle.sol";
import {VillageMarket} from "../src/VillageMarket.sol";
import {VillageBank} from "../src/VillageBank.sol";
import {VillageLens} from "../src/VillageLens.sol";
import {IPriceOracle} from "../src/interfaces/IPriceOracle.sol";

/// @notice Deploys the full game and writes `deployments/<chainId>.json`.
/// Env: PRIVATE_KEY (deployer), ADMIN_ADDRESS (optional; oracle owner + DIVIDEND_ADMIN, defaults to deployer).
/// Run: forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast
contract Deploy is Script {
    uint256 internal constant MONAD_MAINNET = 143;

    struct Addresses {
        Koin koin;
        SimOracle oracle;
        VillageMarket market;
        VillageBank bank;
        VillageLens lens;
    }

    /// @dev Field order must stay alphabetical: forge decodes JSON objects sorted by key.
    struct StockRow {
        uint256 basePrice;
        uint256 dividendRateBps;
        string id;
        string name;
        uint256 sector;
        string sectorId;
        string symbol;
        string ticker;
    }

    Addresses internal a;
    address internal deployer;
    address internal admin;
    string internal stocksOut = "stocks";

    function run() external returns (Addresses memory) {
        require(block.chainid != MONAD_MAINNET, "mainnet deploy disabled");

        uint256 key = vm.envUint("PRIVATE_KEY");
        deployer = vm.addr(key);
        admin = vm.envOr("ADMIN_ADDRESS", deployer);

        vm.startBroadcast(key);
        _deployCore();
        _listStocks();
        _handOver();
        vm.stopBroadcast();

        _write();
        return a;
    }

    function _deployCore() internal {
        IPriceOracle oracle;
        a.oracle = new SimOracle(deployer);
        oracle = IPriceOracle(address(a.oracle));
        a.koin = new Koin(deployer);
        a.market = new VillageMarket(a.koin, oracle, deployer);
        a.bank = new VillageBank(a.koin, a.market, oracle);
        a.lens = new VillageLens(a.koin, a.market, a.bank, oracle);
        a.koin.grantRole(a.koin.MINTER_ROLE(), address(a.market));
        a.koin.grantRole(a.koin.MINTER_ROLE(), address(a.bank));
    }

    /// @dev Roster and initial prices come from config/stocks.json and config/prices.json.
    function _listStocks() internal {
        string memory stocksJson = vm.readFile("config/stocks.json");
        string memory pricesJson = vm.readFile("config/prices.json");
        StockRow[] memory rows = abi.decode(vm.parseJson(stocksJson, ".stocks"), (StockRow[]));

        bytes32[] memory ids = new bytes32[](rows.length);
        int128[] memory prices = new int128[](rows.length);
        for (uint256 i = 0; i < rows.length; i++) {
            SimStock stock = _deployStock(a.market, rows[i].name, rows[i].symbol, rows[i].ticker, rows[i].sector);
            ids[i] = stock.priceId();
            prices[i] = SafeCast.toInt128(
                SafeCast.toInt256(vm.parseJsonUint(pricesJson, string.concat(".", rows[i].ticker)))
            );
            vm.serializeAddress(stocksOut, rows[i].ticker, address(stock));
        }
        a.oracle.setPrices(ids, prices);
    }

    function _handOver() internal {
        a.market.grantRole(a.market.DIVIDEND_ADMIN(), admin);
        if (admin == deployer) return;
        a.market.grantRole(a.market.DEFAULT_ADMIN_ROLE(), admin);
        a.market.renounceRole(a.market.DEFAULT_ADMIN_ROLE(), deployer);
        a.koin.grantRole(a.koin.DEFAULT_ADMIN_ROLE(), admin);
        a.koin.renounceRole(a.koin.DEFAULT_ADMIN_ROLE(), deployer);
        a.oracle.transferOwnership(admin);
    }

    function _write() internal {
        string memory out = "deployment";
        string memory stocksJson = vm.serializeUint(stocksOut, "_count", a.market.stockCount());
        vm.serializeUint(out, "chainId", block.chainid);
        vm.serializeAddress(out, "admin", admin);
        vm.serializeAddress(out, "koin", address(a.koin));
        vm.serializeAddress(out, "oracle", address(a.oracle));
        vm.serializeAddress(out, "market", address(a.market));
        vm.serializeAddress(out, "bank", address(a.bank));
        vm.serializeAddress(out, "lens", address(a.lens));
        string memory finalJson = vm.serializeString(out, "stocks", stocksJson);
        string memory path = string.concat("deployments/", vm.toString(block.chainid), ".json");
        vm.writeJson(finalJson, path);
        console.log("Deployment written to", path);
    }

    function _deployStock(
        VillageMarket market,
        string memory name,
        string memory symbol,
        string memory ticker,
        uint256 sector
    ) internal returns (SimStock stock) {
        stock = new SimStock(string.concat("Simulated ", name), symbol, ticker, SafeCast.toUint8(sector), address(market));
        market.listStock(stock);
    }
}
