import dotenv from 'dotenv';
import { OdooClient, getOdooConfigFromEnv } from '../src/server/utils/odooClient.js';
dotenv.config();

async function investigateExtrasCategory() {
  const config = getOdooConfigFromEnv();
  if (!config) throw new Error('Odoo configuration not found');
  config.timeoutMs = 60000;
  const odoo = new OdooClient(config);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           EXTRAS CATEGORY INVESTIGATION                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get all products in Extras category
  const extrasProducts = await odoo.searchRead('product.template', [
    ['categ_id.name', '=', 'Extras'],
    ['active', '=', true]
  ], ['id', 'name', 'list_price', 'type']);

  console.log('📊 EXTRAS CATEGORY PRODUCTS');
  console.log('='.repeat(60));
  console.log(`Total Products: ${extrasProducts.length}\n`);

  // Group products by type/purpose
  const productAnalysis: Record<string, any[]> = {
    'Flavor Syrups': [],
    'Toppings/Add-ons': [],
    'Sides/Accompaniments': [],
    'Services': [],
    'Other': []
  };

  extrasProducts.forEach((product: any) => {
    const name = product.name.toLowerCase();
    
    if (name.includes('flavor') || name.includes('syrup') || name.includes('vanilla') || 
        name.includes('hazelnut') || name.includes('caramel drizzle')) {
      productAnalysis['Flavor Syrups'].push(product);
    } else if (name.includes('whipped') || name.includes('drizzle') || name.includes('sauce') || 
               name.includes('topping') || name.includes('boba') || name.includes('marshmallow')) {
      productAnalysis['Toppings/Add-ons'].push(product);
    } else if (name.includes('settle') || name.includes('invoice')) {
      productAnalysis['Services'].push(product);
    } else if (name.includes('croissant') || name.includes('bagel') || name.includes('pastry')) {
      productAnalysis['Sides/Accompaniments'].push(product);
    } else {
      productAnalysis['Other'].push(product);
    }
  });

  Object.entries(productAnalysis).forEach(([category, products]) => {
    if (products.length > 0) {
      console.log(`\n${category.toUpperCase()} (${products.length} products):`);
      console.log('-'.repeat(60));
      products.forEach((p: any) => {
        console.log(`  • ${p.name} - ${p.list_price} EGP`);
      });
    }
  });

  // Check current attributes on extras
  console.log('\n\n📋 CURRENT ATTRIBUTES ON EXTRAS PRODUCTS');
  console.log('='.repeat(60));

  for (const product of extrasProducts.slice(0, 5)) {
    const attrLines = await odoo.searchRead('product.template.attribute.line', [
      ['product_tmpl_id', '=', product.id]
    ], ['id', 'attribute_id']);

    if (attrLines.length > 0) {
      console.log(`\n${product.name}:`);
      attrLines.forEach((line: any) => {
        const attrName = Array.isArray(line.attribute_id) ? line.attribute_id[1] : 'Unknown';
        console.log(`  - ${attrName}`);
      });
    }
  }

  // Analysis and recommendations
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              DIAGNOSTIC & RECOMMENDATIONS                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('🔍 ANALYSIS:\n');
  
  console.log('1. PRODUCT TYPES FOUND:');
  Object.entries(productAnalysis).forEach(([category, products]) => {
    if (products.length > 0) {
      console.log(`   - ${category}: ${products.length} items`);
    }
  });

  console.log('\n2. CURRENT STATE:');
  console.log('   - Most extras are simple add-ons without customization options');
  console.log('   - Service items (Settle Due/Invoice) should not have drink attributes');
  console.log('   - Flavor syrups are typically added to other drinks, not sold separately');

  console.log('\n3. POTENTIAL ATTRIBUTES FOR EXTRAS:\n');

  console.log('   A. FOR PASTRIES/SIDES (if any croissants, bagels, etc.):');
  console.log('      • Temperature: Cold, Warm, Toasted');
  console.log('      • Spread/Filling: Butter, Jam, Cream Cheese, Nutella');
  console.log('      • Portion: Half, Full');
  console.log('      WHY: Customers may want their pastries warmed or toasted');

  console.log('\n   B. FOR WHIPPED CREAM/DRIZZLES:');
  console.log('      • Amount: Light, Regular, Extra');
  console.log('      WHY: Some customers prefer light toppings, others want extra');

  console.log('\n   C. FOR FLAVOR SYRUPS:');
  console.log('      • Pump Amount: 1 Pump, 2 Pumps, 3 Pumps');
  console.log('      WHY: Flavor intensity preference');
  console.log('      NOTE: Usually these are added via multi-select to other drinks');

  console.log('\n   D. FOR BOBA/TAPIOCA PEARLS:');
  console.log('      • Amount: Regular, Extra');
  console.log('      • Sugar Level: No Sugar, Less Sugar, Regular');
  console.log('      WHY: Boba itself can have sugar coating');

  console.log('\n4. ITEMS THAT SHOULD NOT HAVE ATTRIBUTES:');
  console.log('   - Simple syrups/flavors (sold as add-ons only)');
  console.log('   - Service items (Settle Due, Settle Invoice)');
  console.log('   - Pre-packaged items');

  console.log('\n5. RECOMMENDED ACTIONS:\n');

  const hasPastries = productAnalysis['Sides/Accompaniments'].length > 0;
  const hasToppings = productAnalysis['Toppings/Add-ons'].length > 0;
  const hasFlavors = productAnalysis['Flavor Syrups'].length > 0;

  if (hasPastries) {
    console.log('   ✅ ADD: Temperature attribute to pastries/sides');
    console.log('   ✅ ADD: Spread/Filling options to pastries');
  } else {
    console.log('   ⏭️  SKIP: No pastries found in Extras');
  }

  if (hasToppings) {
    console.log('   ⚠️  CONSIDER: Amount options for whipped cream/drizzles');
    console.log('   ⚠️  CONSIDER: Sugar level for BOBA pearls (if standalone)');
  }

  if (hasFlavors) {
    console.log('   ℹ️  NOTE: Flavor syrups are typically not sold standalone');
    console.log('   ℹ️  NOTE: They should be available as multi-select on drinks');
  }

  console.log('\n6. PRICING CONSIDERATIONS:');
  console.log('   - Most attribute variations should have NO extra cost');
  console.log('   - Exception: "Extra" amounts could be +5 EGP');
  console.log('   - Premium spreads (Nutella) could be +10 EGP');

  console.log('\n\n📊 SUMMARY:\n');
  console.log(`   Total Extras Products: ${extrasProducts.length}`);
  console.log(`   Need Attributes: ${hasPastries ? 'YES (pastries/sides)' : 'LIMITED'}`);
  console.log(`   Priority Level: ${hasPastries ? 'MEDIUM' : 'LOW'}`);
  console.log(`   Recommendation: ${hasPastries ? 'Add Temperature & Spread options' : 'Keep simple - most are add-ons to other products'}`);

  console.log('\n');
}

investigateExtrasCategory().catch(console.error);
