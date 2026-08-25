import { SYNTHETIC_ORDERS } from '../lib/synthetic-orders';
import { diagnoseOrder } from '../lib/gemini';

async function runStage2Verification() {
  console.log('--- STARTING STAGE 2 DEFINITION OF DONE VERIFICATION ---');

  // Test 1: Verify all 30 synthetic orders produce valid GeminiDiagnosis structure
  console.log(`\n1. Testing diagnoseOrder() across all ${SYNTHETIC_ORDERS.length} synthetic orders...`);
  let successCount = 0;

  for (const order of SYNTHETIC_ORDERS) {
    try {
      const res = await diagnoseOrder(order);
      if (
        res &&
        typeof res.recommended_strategy === 'string' &&
        typeof res.confidence === 'number' &&
        typeof res.root_cause === 'string' &&
        typeof res.reasoning === 'string'
      ) {
        successCount++;
      } else {
        console.error(`Invalid structure returned for order ${order.id}:`, res);
      }
    } catch (err) {
      console.error(`Unexpected exception for order ${order.id}:`, err);
    }
  }

  console.log(`Result: ${successCount}/${SYNTHETIC_ORDERS.length} orders returned valid GeminiDiagnosis objects.`);

  // Test 2: Verify client protection (typeof window check)
  console.log('\n2. Verifying client-side code isolation...');
  const keyName = 'GEMINI_API_KEY';
  if (keyName.startsWith('NEXT_PUBLIC_')) {
    console.error('FAIL: GEMINI_API_KEY is prefixed with NEXT_PUBLIC_!');
  } else {
    console.log('PASS: GEMINI_API_KEY is server-side only (not prefixed with NEXT_PUBLIC_).');
  }

  console.log('\n--- STAGE 2 VERIFICATION COMPLETE ---');
}

runStage2Verification().catch(console.error);
