# Fundout — Marketing Plan v1 (First 30 days)

**Version:** v1 · Drafted June 2026
**Audience:** propfirm traders, English-speaking market
**Channel:** X (Twitter) exclusive in this phase
**Time budget:** 2 hours / day

---

## 1. Goal

**By day 30:** 10–30 beta users actively using Fundout and giving real feedback.

**NOT goals:**
- Followers count.
- Going viral.
- Newsletter signups.
- Brand awareness in the abstract.

If we end month 1 with 10 active beta users and 200 followers, we won.
If we end with 5,000 followers and 0 active users, we failed.

---

## 2. Strategic insight

The game is **NOT** "grow an X account." The game is **start 30 real conversations with active propfirm traders.**

Content is the filter. Engagement is the tool. DMs are the closer.

A trader doesn't follow a stranger and sign up for a beta. A trader has a back-and-forth with someone over weeks, reads their profile, decides they're competent, and then says yes. Our job for 30 days is to engineer those back-and-forths.

---

## 3. Time allocation — 2h per day

| Block | Time | What you do |
|---|---|---|
| **Tactical engagement** | 60–75 min | Reply with VALUE to 15–25 posts from active propfirm accounts. Never "great post." Add data, correction, sharp question. |
| **Your own content** | 30–45 min | 1–2 posts from the content bank. Manrope-style, numeric, no filler. |
| **Lurking + DMs** | 15–30 min | Track who responds well. Run warm DMs when relationship exists. |

Total: ~2h, distributed however the day allows. **Engagement is non-negotiable. Your posts are negotiable** (occasionally skip a day if life happens — never skip engagement).

---

## 4. The 30-day plan in 4 phases

### Phase 1 — Setup + Lurking · Days 1–7

**Day 1 — Account setup**
- [ ] Create @fundout (or close match) on X
- [ ] Profile photo: Fundout symbol on dark tile (use `brand/logo/fundout-favicon@2x.png`)
- [ ] Banner: use the future Twitter header template
- [ ] Bio: tight, manifesto-aligned (see `brand/marketing/bio-options.md` — TBD)
- [ ] Pinned tweet: the manifesto in its strongest form
- [ ] Link: `fundout.app` (or vercel URL until domain is bought)

**Days 2–3 — Build the listening list**
- [ ] Follow 100 propfirm-active accounts
- [ ] Avoid: gurus, $999 course sellers, signal accounts. Look for: real traders posting their own evals, builders in the space, math-aware traders, propfirm employees
- [ ] Create an X List called "Propfirm signal" and add all of them
- [ ] Spend time reading. Identify the 20 most-engaged accounts

**Days 4–7 — Start posting + replying**
- Cadence: 1 post/day + 10 replies/day
- Posts: pull from `content-bank.md` (didactic-leaning to start, hot takes later)
- Replies: focus on the 20 most-engaged accounts. Aim for replies that get likes/responses from THEM, not from randos

**Phase 1 success signal:** 5+ accounts replied to one of yours by day 7.

---

### Phase 2 — Voice + First thread · Days 8–14

- Cadence: 1–2 posts/day + 15–20 replies/day
- **Day 10 — First long thread (10 tweets)**
  Topic candidate: *"The math of a $50k funded account: why most strategies lose before they trade."*
  Goal: a piece that lives as your "calling card" for the next 6 months. People who DM later will reference it.

  Structure:
  1. Hook (counterintuitive opener)
  2. The setup (account size, drawdown, fees)
  3. The math (numbers, no metaphors)
  4. The implication (why most "edges" don't matter)
  5. The counter (what would actually work)
  6. The tool teaser (one line, no link spam)

- Identify and DM 1–2 of the strongest replies you got in week 1 with a follow-up question (no pitch yet)

**Phase 2 success signal:** the thread crosses 5,000 impressions and gets 1+ quote tweet from an account you respect.

---

### Phase 3 — Identify candidates · Days 15–21

- Same cadence
- **The list:** maintain `brand/marketing/candidate-list.md` (gitignored, private). Track:
  - Handle
  - Why they're a fit
  - Last 3 interactions
  - Best topic for warm DM
- Start **warm DMs** with people who have already engaged with you 2+ times. Template:

  > Hey [name], saw your reply on [specific tweet]. Curious — when you said [their point], how do you currently figure out [related decision]? I'm building a tool that runs that math; would love to know if I'm solving the right problem.

  Do NOT pitch the product yet. The DM is reconnaissance + relationship.

- Refine the candidate list to 30–50 high-fit accounts

**Phase 3 success signal:** 10+ DM conversations going at any moment.

---

### Phase 4 — Beta conversion · Days 22–30

- Same cadence on posts + engagement
- 3–5 personalized DMs/day to the candidate list with the beta offer
- DM template for the offer:

  > [Reference earlier conversation]. The tool's ready for a few early users. Would you want a free account to try the Monte Carlo + backtest features against your real evals? I want feedback, not money. 15 min Loom + free access for as long as you'll use it.

- Track conversions in `candidate-list.md`. Goal: 10–15 active beta users by day 30

**Phase 4 success signal:** 10+ traders have logged in and run at least one backtest.

---

## 5. Content pillars (what to post about)

Every post should fall in one of these buckets. Mix 50/30/20 in any given week.

### Pillar A — Math truths (50%)
Numbers-forward, didactic. Examples in `content-bank.md`.
- "The daily drawdown ends more attempts than the max drawdown. 2-to-1 ratio."
- "A 55% win rate at 1:1 RR is $0.10 of edge per dollar risked."

### Pillar B — Manifesto + hot takes (30%)
The brand's POV. Provocative but defensible.
- "Propfirms don't sell funded accounts. They sell hope at $300 a piece."
- "Trading 'psychology' is what people sell when they can't sell math."

### Pillar C — Build in public (20%)
Show the product getting better. Builds trust. Doubles as soft demo.
- Screenshot of a new feature
- A specific math problem you solved this week
- A reply you got from a beta user (anonymized)

**No "motivational" content. No "good morning traders" filler. No follow-for-follow.**

---

## 6. Reply playbook (the 70% of your time)

Every reply should do one of these. Never neutral.

| Type | When | Example |
|---|---|---|
| **Add a number** | They made a general claim | *"Worth noting: with $100k accounts at FTMO's daily 5%, expected ruin in 8 trades is 17%."* |
| **Sharpen the question** | They asked something fuzzy | *"What's your stop in R? Without that, the question doesn't have an answer."* |
| **Disagree with respect** | They said something wrong | *"Not sure I agree — your scenario assumes independent trades. Drawdown rules break that assumption."* |
| **Build on their point** | They were right | *"Extending this — the same math says the optimal attempt count for FTMO 100k is 4 before resetting."* |
| **Ask for their experience** | They shared a result | *"What was your worst losing streak in that run? Curious if it matches the theoretical expectation."* |

**Anti-pattern replies (NEVER):**
- "Great post 🔥"
- "100% this"
- "Following"
- Anything with more than 2 emojis
- Anything with the word "agreed"

---

## 7. DM playbook

Two phases:
1. **Warm DMs** (Phase 3) — recon, not pitch
2. **Beta offer DMs** (Phase 4) — explicit ask

Rules:
- Personalize the opening based on a specific tweet of theirs
- Max 4 lines
- Ask one clear question OR make one clear offer
- Never link to the app in the first DM unless they ask

**Beta offer DM template:**

> [Reference earlier conversation.] Fundout's at the point where I want early users. It does the Monte Carlo + backtest you'd expect, against your actual eval rules. Free for as long as you'd use it. Want a look?

If they say yes → send Loom in <24h → grant access → schedule a 15-min call after first week.

---

## 8. What NOT to do

- ❌ Don't pitch the app in your first 5 posts.
- ❌ Don't tweet links to the app more than 1x/week in week 1–2.
- ❌ Don't reply with emojis-only.
- ❌ Don't engage with toxicity. Mute, don't argue.
- ❌ Don't post when frustrated (delete drafts > regret tweets).
- ❌ Don't buy followers / engagement. Visible from day 1, kills credibility.
- ❌ Don't post the same content across multiple platforms simultaneously. X first, X only, this month.
- ❌ Don't talk about other propfirms negatively by name. Talk about the math.

---

## 9. Daily checklist (your 2 hours)

Morning (or whatever block):

- [ ] Review notifications, respond to mentions (10 min)
- [ ] Open the X List "Propfirm signal," reply to 15–25 posts with value (60 min)
- [ ] Post 1 piece from content bank (15 min)
- [ ] Check candidate list, send 2–5 DMs as needed (20 min)
- [ ] Capture any new candidate or insight in the list (5 min)

End of day:
- [ ] Note in `candidate-list.md`: who responded, who didn't
- [ ] Save best replies you got — they're tomorrow's social proof

---

## 10. Weekly review (Sunday night, 15 min)

Answer these 5 questions every Sunday:

1. **What worked this week?** (1 post, 1 reply, 1 DM — pick the best of each)
2. **What didn't?** (a post that flopped — why?)
3. **Top 3 new candidates** added to the list
4. **Which of my posts got engagement from someone I respect?** Double down on that pattern.
5. **What would I do differently next week?**

Track this in `weekly-reviews.md` (private, gitignored).

---

## 11. Day 30 retrospective

At the end of the month, answer:

- How many active beta users do we have?
- How many of them have given real feedback?
- Of those, how many would recommend the app to another trader?
- What was the cost (in hours) per acquired beta user?
- What's the single biggest blocker for month 2?

This document evolves into `marketing-plan-v2.md` based on those answers.

---

## Appendix — Files referenced

| File | Status |
|---|---|
| `brand/marketing/content-bank.md` | TBD — collection of post-ready headlines |
| `brand/marketing/bio-options.md` | TBD — drafts of the X bio |
| `brand/marketing/candidate-list.md` | TBD — private, gitignored |
| `brand/marketing/weekly-reviews.md` | TBD — private, gitignored |
| `brand/templates/twitter-square.html` | Done — post generator |

---

*Last edited: 2026-06-06*
