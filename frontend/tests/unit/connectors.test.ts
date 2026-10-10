import { describe, expect, it, vi } from "vitest";
import {
  createPrivyBridge,
  createPrivyConnector,
  injectedConnector,
  parseCaip2ChainId,
  selectConnector,
  type PrivyWalletLike,
} from "@/lib/web3";

const ADDRESS = "0x3c550a7c70d3b8e3f2d5755fa0cd63dc1275fd9a";
const CHECKSUM = "0x3C550a7C70d3b8e3F2D5755Fa0cD63Dc1275fD9A";

const makeWallet = (overrides: Partial<PrivyWalletLike> = {}): PrivyWalletLike => ({
  address: ADDRESS,
  chainId: "eip155:10143",
  switchChain: vi.fn(async () => undefined),
  getEthereumProvider: vi.fn(async () => ({ request: vi.fn(async () => "0x1") })),
  ...overrides,
});

const actions = () => ({ openLogin: vi.fn(), logout: vi.fn(async () => undefined) });

describe("connector selection", () => {
  const privy = createPrivyConnector(createPrivyBridge());

  it("uses Privy only when it is configured and requested", () => {
    expect(selectConnector("privy", true, privy)).toBe(privy);
    expect(selectConnector("privy", false, privy)).toBe(injectedConnector);
    expect(selectConnector("injected", true, privy)).toBe(injectedConnector);
  });
});

describe("parseCaip2ChainId", () => {
  it("reads the numeric chain id", () => {
    expect(parseCaip2ChainId("eip155:10143")).toBe(10143);
    expect(parseCaip2ChainId("nonsense")).toBeNull();
  });
});

describe("privy connector", () => {
  it("reports account and chain of the active wallet once settled", async () => {
    const bridge = createPrivyBridge();
    const connector = createPrivyConnector(bridge);
    bridge.update({ settled: true, authenticated: true, wallet: makeWallet() }, actions());
    expect(await connector.getAccount()).toBe(CHECKSUM);
    expect(await connector.getChainId()).toBe(10143);
  });

  it("returns no account for a logged-out user", async () => {
    const bridge = createPrivyBridge();
    const connector = createPrivyConnector(bridge);
    bridge.update({ settled: true, authenticated: false, wallet: null }, actions());
    expect(await connector.getAccount()).toBeNull();
  });

  it("waits for Privy to load instead of reporting no wallet", async () => {
    const bridge = createPrivyBridge();
    const connector = createPrivyConnector(bridge);
    const pending = connector.getAccount();
    bridge.update({ settled: true, authenticated: true, wallet: makeWallet() }, actions());
    expect(await pending).toBe(CHECKSUM);
  });

  it("rejects, rather than dropping the session, when Privy never loads", async () => {
    const bridge = createPrivyBridge();
    const connector = createPrivyConnector(bridge);
    vi.useFakeTimers();
    const result = connector.getAccount().catch((error: Error) => error.message);
    await vi.advanceTimersByTimeAsync(10_001);
    vi.useRealTimers();
    expect(await result).toMatch(/Could not connect/);
  });

  it("connect returns the address straight away when already logged in", async () => {
    const bridge = createPrivyBridge();
    const handlers = actions();
    bridge.update({ settled: true, authenticated: true, wallet: makeWallet() }, handlers);
    expect(await createPrivyConnector(bridge).connect()).toBe(CHECKSUM);
    expect(handlers.openLogin).not.toHaveBeenCalled();
  });

  it("connect opens the login modal and resolves with the new wallet", async () => {
    const bridge = createPrivyBridge();
    const handlers = actions();
    bridge.update({ settled: true, authenticated: false, wallet: null }, handlers);
    const pending = createPrivyConnector(bridge).connect();
    await vi.waitFor(() => expect(handlers.openLogin).toHaveBeenCalledTimes(1));
    bridge.update({ settled: true, authenticated: true, wallet: makeWallet() }, handlers);
    expect(await pending).toBe(CHECKSUM);
  });

  it("maps a closed login modal to a friendly cancelled error", async () => {
    const bridge = createPrivyBridge();
    const handlers = actions();
    bridge.update({ settled: true, authenticated: false, wallet: null }, handlers);
    const pending = createPrivyConnector(bridge).connect();
    await vi.waitFor(() => expect(handlers.openLogin).toHaveBeenCalled());
    bridge.failLogin("exited_auth_flow");
    await expect(pending).rejects.toMatchObject({ code: "cancelled" });
  });

  it("does not leak SDK error details", async () => {
    const bridge = createPrivyBridge();
    const handlers = actions();
    bridge.update({ settled: true, authenticated: false, wallet: null }, handlers);
    const pending = createPrivyConnector(bridge).connect();
    await vi.waitFor(() => expect(handlers.openLogin).toHaveBeenCalled());
    bridge.failLogin("some_internal_code_with_token_abc123");
    await expect(pending).rejects.toThrow(/Could not connect to your wallet/);
  });

  it("switches the wallet to Monad Testnet and maps a failure to wrong_network", async () => {
    const bridge = createPrivyBridge();
    const wallet = makeWallet();
    bridge.update({ settled: true, authenticated: true, wallet }, actions());
    const connector = createPrivyConnector(bridge);
    await connector.switchToTestnet();
    expect(wallet.switchChain).toHaveBeenCalledWith(10143);
    const failing = makeWallet({ switchChain: vi.fn(async () => Promise.reject(new Error("no"))) });
    bridge.update({ settled: true, authenticated: true, wallet: failing }, actions());
    await expect(connector.switchToTestnet()).rejects.toMatchObject({ code: "wrong_network" });
  });

  it("forwards wallet requests to the Privy provider", async () => {
    const bridge = createPrivyBridge();
    const request = vi.fn(async () => "0xabc");
    const wallet = makeWallet({ getEthereumProvider: vi.fn(async () => ({ request })) });
    bridge.update({ settled: true, authenticated: true, wallet }, actions());
    const client = createPrivyConnector(bridge).getWalletClient(CHECKSUM);
    await client.request({ method: "eth_chainId" });
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ method: "eth_chainId" }));
  });

  it("notifies about account and network changes and about log out", () => {
    const bridge = createPrivyBridge();
    const connector = createPrivyConnector(bridge);
    const onAccount = vi.fn();
    const onChain = vi.fn();
    bridge.update({ settled: true, authenticated: true, wallet: makeWallet() }, actions());
    connector.subscribe({ onAccount, onChain });
    bridge.update({ settled: true, authenticated: true, wallet: makeWallet() }, actions());
    expect(onAccount).not.toHaveBeenCalled();
    bridge.update({ settled: true, authenticated: true, wallet: makeWallet({ chainId: "eip155:1" }) }, actions());
    expect(onChain).toHaveBeenCalledWith(1);
    bridge.update({ settled: true, authenticated: false, wallet: null }, actions());
    expect(onAccount).toHaveBeenCalledWith(null);
  });

  it("logs out of Privy on disconnect", async () => {
    const bridge = createPrivyBridge();
    const handlers = actions();
    bridge.update({ settled: true, authenticated: true, wallet: makeWallet() }, handlers);
    await createPrivyConnector(bridge).disconnect?.();
    expect(handlers.logout).toHaveBeenCalledTimes(1);
  });
});
