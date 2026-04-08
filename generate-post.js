const fs = require('fs');
const path = require('path');

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY not set.');
  process.exit(1);
}

const TOPICS = [
  "Best High-Yield Savings Accounts for Americans",
  "How to Build an Emergency Fund on Any Income",
  "Credit Card Rewards Strategies That Actually Work",
  "How to Pay Off Student Loans Faster",
  "Best Budgeting Methods for Beginners",
  "How to Improve Your Credit Score in 90 Days",
  "Side Hustles That Can Pay Off Your Debt",
  "Best No-Annual-Fee Credit Cards Right Now",
  "How to Save for a Down Payment on a House",
  "Debt Snowball vs Debt Avalanche Explained",
  "How to Negotiate Lower Bills and Save Hundreds",
  "Best Bank Account Bonuses Available Right Now",
  "How to Start Investing with Little Money",
  "Understanding APR vs APY and Why It Matters",
  "How to Create a Budget That Actually Sticks",
  "Best Cash Back Credit Cards for Everyday Spending",
  "How to Avoid Common Money Mistakes in Your 30s",
  "Emergency Fund vs Paying Off Debt Which Comes First",
  "How to Read and Understand Your Credit Report",
  "Best Financial Apps for Managing Money",
  "How to Save Money on Groceries Without Coupons",
  "Understanding Balance Transfer Cards and How to Use Them",
  "How to Set Financial Goals You Will Actually Achieve",
  "Best Travel Rewards Credit Cards for Beginners",
  "How to Build Credit as a Young Adult",
  "Smart Money Moves to Make Before Year End",
  "How to Choose Between Renting and Buying a Home",
  "Best Strategies for Paying Off Credit Card Debt",
  "How to Save for Retirement When You Start Late",
  "Understanding FICO Scores vs VantageScores",
  "How to Protect Yourself from Financial Scams",
  "Best Free Financial Tools Available Online",
  "How to Budget as a Freelancer or Gig Worker",
  "Understanding Compound Interest and Why It Matters",
  "How to Teach Your Kids About Money",
  "Best Checking Accounts with No Monthly Fees",
  "How to Plan for Large Purchases Without Going Into Debt",
  "Credit Card Sign Up Bonuses Worth Considering",
  "How to Lower Your Insurance Costs",
  "Best Money Habits for Building Long Term Wealth",
  "How to Handle Financial Stress and Anxiety",
  "Understanding Different Types of Savings Accounts",
  "How to Save Money on Utilities and Energy Bills",
  "Best Resources for Free Financial Education",
  "How to Make a Debt Payoff Plan That Works",
  "Smart Ways to Use Your Tax Refund",
  "How to Build Multiple Streams of Income",
  "Best Strategies for Saving on Healthcare Costs",
  "How to Financially Prepare for a Baby",
  "Understanding Personal Loans and When They Make Sense",
  "How to Avoid Lifestyle Creep as Your Income Grows",
  "Best Ways to Send Money to Family Abroad",
  "How to Choose the Right Credit Card for Your Lifestyle",
  "Best Money Saving Challenges to Try This Month",
  "How to Build Wealth on a Middle Class Income",
  "Understanding Your Employee Benefits Package",
  "Best High Yield CDs Available Right Now",
  "How to Create a Financial Plan for Your Family",
  "Understanding Mortgage Options for First Time Buyers",
  "How to Maximize Credit Card Rewards Without Overspending"
];

const SYSTEM_PROMPT = `You are an expert US personal finance writer for SavingsClub.com in 2026.

RULES:
- Write exactly 1000-1200 words
- Return ONLY clean HTML - no markdown, no backticks, no preamble text
- Start with: <p style="font-size:.82rem;color:#888;margin-bottom:16px">⚠️ Rates, offers, and financial information in this article reflect conditions as of early 2026. Always verify current information with providers before making financial decisions.</p>
- Then an H1 title
- Use 3-4 H2 subheadings
- Friendly expert tone
- Reference US states naturally: California, Texas, Florida, New York, Illinois, Georgia, Pennsylvania, Ohio, North Carolina, Michigan
- Do NOT fabricate statistics or credentials
- End with: <div class="cta-box"><h3>CTA Title</h3><p>Description</p><a href="#tools" class="btn btn-gold" onclick="showPage('tools')" style="margin-top:10px">Tool Name →</a></div>
- Link to: Savings Calculator, Budget Planner, Debt Payoff Calculator, or Credit Card Comparison`;

function pickTopic() {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  return TOPICS[dayOfYear % TOPICS.length];
}

function pickCategory(topic) {
  const t = topic.toLowerCase();
  if (t.includes('savings') || t.includes('save') || t.includes('emergency fund') || t.includes('cd')) return 'Savings';
  if (t.includes('budget') || t.includes('spending')) return 'Budgeting';
  if (t.includes('credit card') || t.includes('rewards') || t.includes('cash back') || t.includes('sign up bonus')) return 'Credit Cards';
  if (t.includes('debt') || t.includes('pay off') || t.includes('loan') || t.includes('balance transfer')) return 'Debt';
  if (t.includes('credit score') || t.includes('credit report') || t.includes('build credit') || t.includes('fico')) return 'Credit';
  if (t.includes('bank') || t.includes('checking') || t.includes('account') || t.includes('mortgage')) return 'Banking';
  if (t.includes('invest') || t.includes('retirement') || t.includes('wealth')) return 'Investing';
  return 'Tips';
}

async function generatePost(topic) {
  console.log('Calling Claude API...');
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Write a blog post about: ${topic}` }]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
    .replace(/```html/g, '')
    .replace(/```/g, '')
    .trim();
}

async function main() {
  const topic = pickTopic();
  const category = pickCategory(topic);
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const id = Date.now();

  console.log(`\n📝 SavingsClub Blog Generator`);
  console.log(`   Topic: ${topic}`);
  console.log(`   Category: ${category}`);
  console.log(`   Date: ${date}\n`);

  const content = await generatePost(topic);

  const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const title = titleMatch ? titleMatch[1] : topic;

  const post = { id, title, cat: category, date, preview: `Expert guide: ${topic.toLowerCase()}.`, content };

  // Save to generated-posts.json
  const postsFile = path.join(__dirname, 'generated-posts.json');
  let posts = [];
  try { posts = JSON.parse(fs.readFileSync(postsFile, 'utf8')); } catch(e) { posts = []; }
  posts.push(post);
  fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));

  // Update index.html
  const htmlFile = path.join(__dirname, 'index.html');
  let html = fs.readFileSync(htmlFile, 'utf8');

  // Build JS array of all generated posts
  const jsArray = posts.map(p => {
    const safe = p.content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    return `{id:${p.id},title:${JSON.stringify(p.title)},cat:${JSON.stringify(p.cat)},date:${JSON.stringify(p.date)},preview:${JSON.stringify(p.preview)},content:\`${safe}\`}`;
  }).join(',\n');

  const newLine = `const generatedPosts=[${jsArray}]; // __GENERATED_POSTS__`;

  if (html.includes('const generatedPosts=[')) {
    // Replace existing generated posts line
    html = html.replace(/const generatedPosts=\[[\s\S]*?\]; \/\/ __GENERATED_POSTS__/, newLine);
  } else if (html.includes('// __GENERATED_POSTS__')) {
    // First time - replace marker
    html = html.replace('// __GENERATED_POSTS__', newLine);
  } else {
    console.error('ERROR: Could not find __GENERATED_POSTS__ marker in index.html');
    console.log('Posts saved to generated-posts.json but index.html was not updated.');
    console.log('You may need to re-upload the latest index.html from Claude.');
    process.exit(1);
  }

  fs.writeFileSync(htmlFile, html);

  console.log(`✅ Published: "${title}"`);
  console.log(`   Total generated posts: ${posts.length}`);
  console.log(`   index.html updated\n`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
