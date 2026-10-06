"use client";

import { ASSETS, SECTOR_UNLOCK_VALUE, getSector, getStocksBySector } from "@/config";
import { formatCoins, formatPrice, formatShares, getNextLevelTarget } from "@/lib";
import { useGameStore, useUiStore } from "@/stores";
import type { StockView } from "@/types";
import { GameImage, Meter, Modal, NpcSpeech, Stat } from "@/components/pages/(shared)";

interface LotCardProps {
  name: string;
  ticker: string;
  stockId: StockView["id"];
  view: StockView;
  busy: boolean;
  onHarvest: () => void;
  onBuy: () => void;
}

function LotCard({ name, ticker, stockId, view, busy, onHarvest, onBuy }: LotCardProps) {
  const target = getNextLevelTarget(view.level);
  const nextLevel = view.level + 1;

  return (
    <li className="panel flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <GameImage src={ASSETS.stockIcon(stockId)} alt="" width={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-extrabold">{name}</p>
          <p className="text-xs text-soft">
            {ticker} - {formatPrice(view.price)} Simulated
          </p>
        </div>
        <p className="rounded-control bg-muted px-2 py-1 text-xs font-bold">
          {view.level === 0 ? "Available" : `Level ${view.level}`}
        </p>
      </div>

      {view.level === 0 ? (
        <button type="button" className="btn btn-secondary" onClick={onBuy}>
          Buy {name}
        </button>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-3">
            <Stat label="Shares" value={formatShares(view.walletShares + view.collateralShares)} />
            <Stat label="Value" value={formatCoins(view.value)} />
            <Stat label="In collateral" value={formatShares(view.collateralShares)} />
          </dl>
          {target ? (
            <Meter
              value={view.value}
              max={target}
              label={`${formatCoins(view.value)} / ${formatCoins(target)} Coins to Level ${nextLevel}`}
            />
          ) : (
            <p className="text-xs font-bold text-positive">Maximum level reached.</p>
          )}
        </>
      )}

      {view.pendingHarvest > 0 && (
        <button type="button" className="btn btn-primary" disabled={busy} onClick={onHarvest}>
          Harvest {formatCoins(view.pendingHarvest)} Coins
        </button>
      )}
    </li>
  );
}

export default function DistrictPanel() {
  const player = useGameStore((state) => state.player);
  const busy = useGameStore((state) => state.busy);
  const harvest = useGameStore((state) => state.harvest);
  const sectorId = useUiStore((state) => state.selectedSector);
  const closePanel = useUiStore((state) => state.closePanel);
  const openShop = useUiStore((state) => state.openShop);

  if (!player || !sectorId) return null;

  const sector = getSector(sectorId);
  const sectorView = player.sectors.find((item) => item.id === sectorId);
  if (!sectorView) return null;

  return (
    <Modal title={sector.district} onClose={closePanel}>
      <div className="flex flex-col gap-4">
        <NpcSpeech npc="guide" text={sectorView.unlocked ? sector.lore : sector.lockedHint} />

        <dl className="grid grid-cols-2 gap-3">
          <Stat label={`${sector.label} value`} value={`${formatCoins(sectorView.value)} Coins`} />
          <Stat label="Status" value={sectorView.unlocked ? "Unlocked" : "Locked"} tone={sectorView.unlocked ? "positive" : "caution"} />
        </dl>

        {!sectorView.unlocked && (
          <Meter
            value={sectorView.value}
            max={SECTOR_UNLOCK_VALUE}
            label={`${formatCoins(sectorView.value)} / ${SECTOR_UNLOCK_VALUE} Coins to unlock`}
          />
        )}

        <ul className="flex flex-col gap-3">
          {getStocksBySector(sectorId).map((stock) => {
            const view = player.stocks.find((item) => item.id === stock.id);
            return view ? (
              <LotCard
                key={stock.id}
                name={stock.name}
                ticker={stock.ticker}
                stockId={stock.id}
                view={view}
                busy={busy}
                onHarvest={() => void harvest(stock.id)}
                onBuy={() => openShop({ stockId: stock.id, sector: sectorId })}
              />
            ) : null;
          })}
        </ul>

        <button type="button" className="btn btn-primary" onClick={() => openShop({ sector: sectorId })}>
          Buy more
        </button>
      </div>
    </Modal>
  );
}
