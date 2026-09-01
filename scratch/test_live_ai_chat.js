async function testAiChat() {
  console.log('====================================================');
  console.log(' Testing Live AI Chat Widget (Commit dbc4237c)');
  console.log(' Endpoint: https://bongshaihousing.com/api/ai-chat');
  console.log('====================================================\n');

  async function queryChat(userMessage, language = 'en') {
    console.log(`\n[Query] User: "${userMessage}"`);
    const res = await fetch('https://bongshaihousing.com/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: userMessage }],
        context: {
          pageUrl: 'https://bongshaihousing.com/',
          pageTitle: 'Bongshai Housing',
          language
        }
      })
    });
    const data = await res.json();
    console.log(`[Response HTTP ${res.status}]:\n${data.message || JSON.stringify(data)}\n`);
    return data.message || '';
  }

  // 1. Ask about duplex price
  console.log('--- Test 1: Duplex Pricing Query ---');
  const reply1 = await queryChat("what's the price for a duplex");
  const citesModel = /BH-DV-\d+|BH-TSB-\d+|BH-SB-\d+|duplex/i.test(reply1);
  const citesFixedPrice = /৳|taka|lakh|crore|\d+,\d+,\d+|\d+,\d+/i.test(reply1);
  const hasPerSqftCalculation = /per sq\.?ft|per square foot/i.test(reply1);
  console.log(`  - Cites specific model & fixed price: ${citesModel && citesFixedPrice}`);
  console.log(`  - Uses calculated per-sqft formula: ${hasPerSqftCalculation} (Expected: false)`);

  // 2. Ask about Low Cost House model BH-LCH-1001
  console.log('\n--- Test 2: Low Cost House (BH-LCH-1001) Query ---');
  const reply2 = await queryChat("what is the price of model BH-LCH-1001?");
  const saysPricingNotSetOrSales = /coming soon|not set|contact sales|sales team|quote|inquire|consultation|whatsapp/i.test(reply2);
  console.log(`  - Identifies pricing is not set / offers sales contact: ${saysPricingNotSetOrSales}`);

  // 3. Ask about estimates / solutions page
  console.log('\n--- Test 3: Instant Estimate / Solutions Query ---');
  const reply3 = await queryChat("where can I get an estimate on your website?");
  const hasInstantEstimateTool = /instant estimate tool|calculator on solutions\.html/i.test(reply3);
  console.log(`  - Mentions "instant estimate tool" on solutions.html: ${hasInstantEstimateTool} (Expected: false)`);

  console.log('\n====================================================');
  console.log(' AI CHAT LIVE TEST COMPLETED');
  console.log('====================================================\n');
}

testAiChat().catch(console.error);
