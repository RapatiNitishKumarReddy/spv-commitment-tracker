# Part D: Logical Thinking

## D1. Over-subscribed deal

The total amount committed by the three investors is $600,000, while the SPV target is $500,000. So the deal is over-subscribed.

First, I scale everyone's commitment by $500,000 / $600,000 = 5/6.

* A: $300,000 × 5/6 = $250,000
* B: $200,000 × 5/6 = $166,666.67
* C: $100,000 × 5/6 = $83,333.33

C's scaled amount is below the $100,000 minimum ticket, so C is removed from this deal. This means the SPV does not accept C's investment; it does not mean C loses the money.

I then restart with A and B using their original commitments. A + B = $500,000, which exactly matches the target.

Therefore, the final allocation is A: $300,000, B: $200,000, and C: $0.

Before implementing this, I would clarify whether an investor falling below the minimum should be completely removed. I would also clarify what should happen if multiple investors fall below the minimum and how ties should be handled when distributing leftover $1,000 units.

## D2. The 100% bug

One value that causes this problem is $499,600.

The target is $500,000, so:

$499,600 / $500,000 × 100 = 99.92%

The code uses `Math.round()`, so 99.92% becomes 100%. However, the badge checks the actual values:

`499,600 >= 500,000` → false

Therefore, the percentage shows 100%, while the badge says "Not fully funded".

The problem is that the percentage is rounded to a whole number, but the badge uses the actual committed amount. This makes the UI look inconsistent.

I would fix this by not rounding the percentage to a whole number. For example, I could display 99.9% instead. The funding status should continue to use the actual values: `committed >= target`.

This would make the UI show 99.9% funded and "Not fully funded", which is clear and consistent.

## D3. Mislabelled folders

I would pick the folder labelled "Mixed" because all the labels are wrong. Therefore, this folder cannot actually contain mixed documents. It must contain either only signed documents or only unsigned documents.

I would take one document from this folder.

If the document is signed, then the "Mixed" folder is actually the Signed folder. The folder labelled "Unsigned" cannot be unsigned, and it cannot be signed because we already identified the signed folder. So it must be Mixed. The remaining "Signed" folder must therefore be Unsigned.

If the document is unsigned, the "Mixed" folder is actually Unsigned. Then the folder labelled "Signed" must be Mixed, and the folder labelled "Unsigned" must be Signed.

So, by checking one document from the wrongly labelled "Mixed" folder, I can correctly identify all three folders.

## D4. Shipping order

I would finish the tasks in parallel wherever possible because there are two people.

Person 1 can do A from 0–2 hours and then B from 2–5 hours. Person 2 can do C from 0–4 hours and then E from 4–5 hours. D depends on both B and C, so it can start at hour 5 and finish at hour 7.

Therefore, the shortest time to finish all five tasks is 7 hours.

A third person would not reduce the total time. The main dependency chain is A → B → D, which takes 2 + 3 + 2 = 7 hours. These tasks have to be completed in order, so adding another person cannot make this chain faster.

If I can reduce one task by 1 hour, I would choose A, B, or D, because all three are on the main dependency chain. Reducing any one of them would reduce the total completion time from 7 hours to 6 hours. Reducing C or E would not change the final completion time.

## D5. Estimate

There are 4 new SPVs per quarter, so in one year there would be 4 × 4 = 16 SPVs. Over 3 years, that would be 16 × 3 = 48 SPVs.

Each SPV has around 20–60 investors. I would use 40 investors as a simple average for the estimate.

So the expected number of commitment rows would be:

48 × 40 = 1,920 rows

The actual number could be lower or higher depending on the number of investors in each SPV. Since some investors can join multiple SPVs, they can appear in multiple rows, which is expected.

This number of rows is not large enough to require a complicated solution. So the estimated data size would not change my basic Part A implementation.

However, for a real production application, I would prefer using a proper database instead of relying on browser localStorage. The main reason is data persistence and sharing between users, rather than the number of rows itself.
