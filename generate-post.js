const fs = require('fs');
const path = require('path');

// ============================================
// SavingsClub Automated Blog Post Generator
// Runs weekly via GitHub Actions
// ============================================

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY environment variable is not set.');
  process.exit(1);
}

// --- Topic rotation ---
// The script picks a topic based on the current week number so it cycles
// through different finance subjects automatically.
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
  "Emergency Fund vs Paying Off Debt — Which Comes First",
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
  "Credit Card Sign-Up Bonuses Worth Considering",
  "How to Lower Your Insurance Costs",
  "Best Money Habits for Building Long-Term Wealth",
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
  "Best Ways to Send Money to Family Abroad"
];

const STATES = [
  'California', 'Texas', 'Florida', 'New York', 'Illinois',
  'Georgia', 'Pennsylvania', 'Ohio', 'North Carolina', 'Michigan'
];

const CATEGORIES = [
  'Savings', 'Budgeting', 'Credit Cards', 'Debt',
  'Credit', 'Banking', 'Investing', 'Tips'
];

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
}

function pickTopic() {
  const week = getWeekNumber();
  return TOPICS[week % TOPICS.length];
}

function pickCategory(topic) {
  const lower = topic.toLowerCase();
  if (lower.includes('savings') || lower.includes('save') || lower.includes('emergency fund')) return 'Savings';
  if (lower.includes('budget') || lower.includes('spending')) return 'Budgeting';
  if (lower.includes('credit card') || lower.includes('rewards') || lower.includes('cash back')) return 'Credit Cards';
  if (lower.includes('debt') || lower.includes('pay off') || lower.includes('loan')) return 'Debt';
  if (lower.includes('credit score') || lower.includes('credit report') || lower.includes('build credit')) return 'Credit';
  if (lower.includes('bank') || lower.includes('checking') || lower.includes('account')) return 'Banking';
  if (lower.includes('invest') || lower.includes('retirement')) return 'Investing';
  return 'Tips';
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });
}

const SYSTEM_PROMPT = `You are an expert US personal finance writer for SavingsClub.com in 2026. You write clear, actionable, trustworthy content for working Americans aged 25-55.

WRITING RULES:
- Write exactly 1,000-1,200 words
- Return ONLY clean HTML (no markdown, no backticks, no preamble)
- Start with an H1 title tag
- Use 3-4 H2 subheadings to structure the article
- Use H3 subheadings within sections where appropriate
- Write in a friendly, knowledgeable tone — like a smart friend explaining finance
- Naturally reference these US states where relevant: California, Texas, Florida, New York, Illinois, Georgia, Pennsylvania, Ohio, North Carolina, Michigan
- Use phrases like "across the US", "no matter what state you live in", "whether you're in California or Florida"
- Include specific dollar amounts, percentages, and actionable steps
- Do NOT fabricate statistics — use general knowledge and say "studies suggest" or "financial experts recommend" rather than citing specific fake numbers
- Do NOT invent company credentials, endorsements, or fake testimonials
- End with a call-to-action div linking to a SavingsClub tool, formatted as:
  <div class="cta-box"><h3>CTA Heading</h3><p>CTA description</p><a href="#tools" class="btn btn-gold" onclick="showPage('tools')" style="margin-top:10px">Tool Name →</a></div>
- Link to relevant tools: Savings Calculator, Budget Planner, Debt Payoff Calculator, or Credit Card Comparison
- Add this disclaimer as the VERY FIRST element before the H1:
  <p style="font-size:.82rem;color:#888;margin-bottom:16px">⚠️ Rates, offers, and financial information in this article reflect conditions as of early 2026. Always verify current information with providers before making financial decisions.</p>

SEO RULES:
- Use the primary keyword in the H1, first paragraph, at least one H2, and naturally throughout
- Keep paragraphs short (2-4 sentences) for readability
- Use bold for key terms and important numbers
- Internal link to SavingsClub.com tools naturally within the content
- Write for humans first, search engines second`;

async function generatePost(topic) {
  console.log(`Generating post about: "${topic}"...`);

  const response = await fetch(ANTHROPIC_API_URL, {
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
      messages: [{
        role: 'user',
        content: `Write a comprehensive, SEO-optimized blog post about: ${topic}\n\nTarget audience: Working Americans aged 25-55 across all 50 states.\nYear: 2026\nTone: Friendly expert — knowledgeable but approachable.\nLength: 1,000-1,200 words.\nReturn clean HTML only.`
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('');

  // Clean up any markdown artifacts
  return content
    .replace(/```html/g, '')
    .replace(/```/g, '')
    .trim();
}

async function main() {
  const topic = pickTopic();
  const category = pickCategory(topic);
  const date = formatDate();

  console.log(`\n📝 SavingsClub Auto Blog Generator`);
  console.log(`   Topic: ${topic}`);
  console.log(`   Category: ${category}`);
  console.log(`   Date: ${date}\n`);

  // Generate the article
  const content = await generatePost(topic);

  // Extract title from H1 tag
  const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const title = titleMatch ? titleMatch[1] : topic;

  // Create the post object
  const post = {
    id: Date.now(),
    title: title,
    cat: category,
    date: date,
    preview: `Expert guide on ${topic.toLowerCase()} for Americans in 2026.`,
    content: content
  };

  // Read existing generated posts
  const postsFile = path.join(__dirname, 'generated-posts.json');
  let posts = [];
  if (fs.existsSync(postsFile)) {
    posts = JSON.parse(fs.readFileSync(postsFile, 'utf8'));
  }

  // Add new post
  posts.push(post);

  // Save updated posts
  fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));

  console.log(`✅ Post generated: "${title}"`);
  console.log(`   Category: ${category}`);
  console.log(`   Saved to: generated-posts.json`);
  console.log(`   Total generated posts: ${posts.length}\n`);

  // Now update the HTML file to include the new post
  updateHTML(posts);
}

function updateHTML(generatedPosts) {
  const htmlFile = path.join(__dirname, 'index.html');

  if (!fs.existsSync(htmlFile)) {
    console.error('ERROR: index.html not found.');
    process.exit(1);
  }

  let html = fs.readFileSync(htmlFile, 'utf8');

  // Build the generated posts JavaScript array
  const postsJS = generatedPosts.map(p => {
    // Escape backticks and backslashes in content for template literals
    const safeContent = p.content
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$\{/g, '\\${');

    return `{id:${p.id},title:${JSON.stringify(p.title)},cat:${JSON.stringify(p.cat)},date:${JSON.stringify(p.date)},preview:${JSON.stringify(p.preview)},content:\`${safeContent}\`}`;
  }).join(',\n');

  // Replace the GENERATED_POSTS placeholder
  const marker = '// __GENERATED_POSTS__';
  if (html.includes(marker)) {
    html = html.replace(
      marker,
      `const generatedPosts=[${postsJS}]; // __GENERATED_POSTS__`
    );
    // On subsequent runs, replace the whole line
  } else if (html.includes('const generatedPosts=[')) {
    // Replace existing generated posts array
    html = html.replace(
      /const generatedPosts=\[[\s\S]*?\]; \/\/ __GENERATED_POSTS__/,
      `const generatedPosts=[${postsJS}]; // __GENERATED_POSTS__`
    );
  }

  fs.writeFileSync(htmlFile, html);
  console.log('✅ index.html updated with new post.');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
