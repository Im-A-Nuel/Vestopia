import { describe, expect, it } from "vitest";
import { mockGameService as service } from "@/services/mockGameService";

const ADDRESS = "0xplayer";

const koin = async (): Promise<number> => (await service.getPlayer(ADDRESS)).koin;

describe("mockGameService", () => {
  it("claims the starter Coins only once", async () => {
    expect((await service.claimStarter(ADDRESS)).status).toBe("success");
    expect(await koin()).toBe(1000);
    const second = await service.claimStarter(ADDRESS);
    expect(second).toMatchObject({ status: "error", code: "already_claimed" });
    expect(await koin()).toBe(1000);
  });

  it("rejects invalid and oversized trades", async () => {
    await service.claimStarter(ADDRESS);
    expect(await service.buy(ADDRESS, "nvda", 0)).toMatchObject({ status: "error", code: "invalid_amount" });
    expect(await service.buy(ADDRESS, "nvda", 5000)).toMatchObject({ status: "error", code: "insufficient_koin" });
    expect(await service.sell(ADDRESS, "nvda", 10)).toMatchObject({ status: "error", code: "insufficient_shares" });
  });

  it("runs the full demo script with the spec numbers", async () => {
    await service.claimStarter(ADDRESS);
    await service.buy(ADDRESS, "nvda", 300);
    await service.buy(ADDRESS, "nem", 600);

    let player = await service.getPlayer(ADDRESS);
    expect(player.koin).toBe(100);
    expect(
      player.sectors
        .filter((sector) => sector.unlocked)
        .map((sector) => sector.id)
        .sort(),
    ).toEqual(["commodity", "tech"]);

    expect((await service.deposit(ADDRESS, "nem", "max")).status).toBe("success");
    expect((await service.borrow(ADDRESS, 301)).code).toBe("exceeds_borrow_limit");
    expect((await service.borrow(ADDRESS, 280)).status).toBe("success");

    player = await service.getPlayer(ADDRESS);
    expect(player.koin).toBe(380);
    expect(player.healthFactor).toBeCloseTo(1.714, 3);
    expect(player.weather).toBe("sunny");

    await service.buy(ADDRESS, "adm", 250);
    expect((await service.getPlayer(ADDRESS)).koin).toBe(130);

    await service.triggerEvent("gold_crash");
    player = await service.getPlayer(ADDRESS);
    expect(player.healthFactor).toBeCloseTo(1.0286, 3);
    expect(player.weather).toBe("stormy");
    expect((await service.withdraw(ADDRESS, "nem", "max")).code).toBe("unsafe_withdraw");

    await service.repay(ADDRESS, 120);
    player = await service.getPlayer(ADDRESS);
    expect(player.koin).toBe(10);
    expect(player.debt).toBe(160);
    expect(player.weather).toBe("sunny");

    await service.triggerEvent("harvest_day");
    player = await service.getPlayer(ADDRESS);
    expect(player.totalPendingHarvest).toBeCloseTo(28.4, 6);

    expect((await service.harvestAll(ADDRESS)).status).toBe("success");
    expect(await koin()).toBeCloseTo(38.4, 6);
    expect((await service.harvestAll(ADDRESS)).code).toBe("nothing_to_harvest");
  });

  it("publishes the latest event with an increasing sequence", async () => {
    await service.triggerEvent("tech_boom");
    await service.triggerEvent("reset");
    const latest = await service.getLatestEvent();
    expect(latest).toMatchObject({ id: "reset", sequence: 2 });
  });

  it("wipes all demo data on reset", async () => {
    await service.claimStarter(ADDRESS);
    await service.triggerEvent("tech_boom");
    expect((await service.resetDemo()).status).toBe("success");
    expect((await service.getPlayer(ADDRESS)).koin).toBe(0);
    expect(await service.getLatestEvent()).toBeNull();
  });

  it("tracks cost basis and scales it down when shares are sold", async () => {
    await service.claimStarter(ADDRESS);
    await service.buy(ADDRESS, "nvda", 300);
    await service.triggerEvent("tech_boom");

    let nvda = (await service.getPlayer(ADDRESS)).stocks.find((stock) => stock.id === "nvda");
    expect(nvda?.costBasis).toBeCloseTo(300, 6);
    expect(nvda?.value).toBeCloseTo(375, 6);

    await service.sell(ADDRESS, "nvda", 187.5);
    nvda = (await service.getPlayer(ADDRESS)).stocks.find((stock) => stock.id === "nvda");
    expect(nvda?.costBasis).toBeCloseTo(150, 6);

    await service.sell(ADDRESS, "nvda", "max");
    nvda = (await service.getPlayer(ADDRESS)).stocks.find((stock) => stock.id === "nvda");
    expect(nvda?.costBasis).toBe(0);
  });

  it("exposes the market and a bounded event log, newest first", async () => {
    await service.triggerEvent("tech_boom");
    await service.triggerEvent("gold_crash");
    const market = await service.getMarket();
    expect(market.prices.nvda).toBeCloseTo(175, 6);
    expect(market.prices.nem).toBeCloseTo(33, 6);

    const log = await service.getEventLog();
    expect(log.map((entry) => entry.id)).toEqual(["gold_crash", "tech_boom"]);

    for (let index = 0; index < 12; index += 1) {
      await service.triggerEvent("reset");
    }
    expect((await service.getEventLog()).length).toBe(10);
  });
});
