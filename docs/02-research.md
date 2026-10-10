# 2. Research

This document collects data that supports the Vestopia idea. Every number comes with a source. Some figures come from news articles or small academic papers and are flagged. Check the original source before quoting them in final materials.

*Research collected on 10 October 2026.*

## 1. Financial literacy is low worldwide

- The **S&P Global FinLit Survey** found only about **33%** of adults worldwide are financially literate. A person counts as literate when they answer at least 3 of 4 basic questions correctly: interest, compound interest, inflation and risk diversification.
- That implies about 3.5 billion adults, mostly in developing economies, lack basic financial understanding.
- Education matters a lot: in major advanced economies, 31% of adults with up to 8 years of schooling are financially literate, versus 73% of those with at least 15 years.
- Gender gap: 35% of men versus 30% of women.

Sources: [FA Solutions summary of S&P Global FinLit](https://fasolutions.com/blog/only-33-of-adults-are-financially-literate/), [PlanSponsor](https://www.plansponsor.com/financial-education-is-needed-globally/).
*Note: the sources do not state the survey's release year. Check the year in the original report.*

## 2. Indonesia: banks are familiar, capital markets are not

The 2025 National Survey of Financial Literacy and Inclusion (SNLIK) by OJK and BPS:

| Measure | Literacy | Inclusion |
|---|---|---|
| National | 66.46% | 80.51% |
| Banking | 65.50% | 70.65% |
| **Capital market** | **17.78%** | **1.34%** |

The capital market is among the sectors with the lowest literacy and inclusion, together with microfinance and P2P lending. The gap is large: many people have a bank account, but very few truly understand or use the capital market.

Sources: [Detik Finance](https://finance.detik.com/moneter/d-7896819/tingkat-melek-akses-pasar-modal-ri-masih-rendah-begini-hasil-surveinya), [Investortrust](https://investortrust.id/financial/64851/hasil-snlik-2025-indeks-literasi-dan-inklusi-keuangan-masih-ditopang-sektor-perbankan), [OJK](https://ojk.go.id/id/berita-dan-kegiatan/siaran-pers/Pages/OJK-Gandeng-BPS-Gelar-Survei-Nasional-Literasi-dan-Inklusi-Keuangan-SNLIK-Tahun-2025.aspx).
*Note: the sources do not specify which calculation method was used. See the official OJK report for full tables.*

## 3. Young investors in Indonesia are growing fast

KSEI and OJK data for 2025:

- **17.59 million** capital market SIDs (investor IDs) as of 8 August 2025, up 18% from the end of 2024 (14.87 million).
- **19.32 million** capital market investors as of 7 November 2025, up about 30% from 14.87 million.
- **54.20%** of capital market investors as of September 2025 are **under 30 years old** (OJK). This approximates Gen Z and younger millennials, not an exact figure.
- Yet the number of investors who trade actively each day is much smaller, around 147,000 to 179,000 throughout 2025 (an academic paper, secondary source, not verified directly with KSEI).
- Investors directly connected to the stock market remain below 3% of the population (statement by a brokerage professional, January 2025).

Conclusion: many accounts are opened by young people, but understanding and engagement remain low. That is a gap suited to a fun educational product.

Sources: [Bisnis.com, 17.59 million SID](https://market.bisnis.com/read/20250811/7/1901203/makin-ramai-investor-pasar-modal-ri-tembus-1759-juta-sid), [Infobank News](https://infobanknews.com/investor-pasar-modal-ri-masih-didominasi-milenial-dan-gen-z-ini-datanya/), [Investortrust, Mandiri Sekuritas investors](https://investortrust.id/market/39279/investor-individu-mandiri-sekuritas-naik-45-semester-i-milenial-dan-gen-z-mendominasi).

## 4. Gamification can help investing education, but it has risks

**Positive evidence (small, not randomized):**
- The **Stock Rising** study at an Indonesian vocational school reports student financial literacy scores rising from **53.60 to 79.10** after using a stock investing simulation. Sample size and control group are not visible in the summary, so read with caution.
- A pretest-posttest study (Atlantis Press, 2019) concluded gamification helped young people understand the stock market, although the comparison group was not randomly assigned.

Sources: [Stock Rising, UMY Journal](https://journal.umy.ac.id/index.php/jati/article/view/26954), [Atlantis Press ICAESS 2019](https://www.atlantis-press.com/article/125925946).

**An important warning:**
- An **AMF** experiment (the French financial markets regulator) found game elements such as badges and confetti are **not neutral**: they can push young investors toward taking more risk.

Source: [AMF behavioural experiment](https://www.amf-france.org/sites/institutionnel/files/pdf/71611/en/Gamification_tends_to_increase_investment_risk-taking%2C_according_to_behavioural_finance_experiment_conducted_for_the_AMF.pdf?1765082701).

**Lessons for Vestopia:**
- Do not only hand out rewards. Show **consequences** too, such as cloudy and stormy weather when debt is too high.
- Avoid heavy celebration effects when a player takes on high risk.
- After a demo event, measure real learning impact (a quiz before and after playing). The existing evidence is thin and mostly from small studies.

*Honest note: evidence on long-term effects and real behavior (saving, borrowing, trading) is lacking. Vestopia has no data of its own yet.*

## 5. Why Monad

- Monad is a Layer 1 blockchain that is **EVM-compatible**: apps written for Ethereum can run with minimal changes. That is why our contracts use Solidity and viem as usual.
- Its architecture uses parallel execution and the MonadBFT consensus for high speed. The 10,000 TPS figure was reported from internal devnet testing.
- Low fees and fast confirmation suit a game with many small transactions (buy, sell, deposit, borrow).

Sources: [Monad, parallel execution](https://monad.xyz/blog/parallel-execution-monad), [The Block, devnet 10,000 TPS](https://www.theblock.co/amp/post/278182/monad-10000-tps-devnet-launch).
*Note: block time and finality figures differ between sources. For official technical numbers, see the Monad documentation.*

## 6. Similar products

Stock simulators already exist, such as investing simulators on financial education sites and "virtual trading" features in some brokerage apps. They are usually tables and charts. We have not done an in-depth competitor analysis, so this section must be completed before using it to claim "nothing similar exists". The position we want to take:

- A game look (a village), not a stock dashboard.
- Loans and risk explained through weather.
- Assets are truly on-chain on Monad, so people can try it with no real money while learning how to use a wallet.

## Open research questions

1. How much does understanding improve after playing Vestopia? (needs a small test with a quiz before and after)
2. Do players understand what cloudy and stormy weather mean without extra explanation?
3. Does email or Google login really lower the barrier compared with a regular wallet?
4. Who are the direct competitors in Indonesia and Southeast Asia?
