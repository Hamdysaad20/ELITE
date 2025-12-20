
# POS System Issues Report (Context-Aware, Best Practices)

**Generated:** 12/18/2025, 6:55:19 AM

**Total Issues Found:** 32

---


## Key Context & Best Practices

- **Sugar Level Logic by Preparation:**
	- For takeaway hot drinks (e.g., most hot coffee), do NOT require a sugar level in the system—customers add sugar themselves at the condiment station. Any errors for missing sugar on these should be ignored.
	- For Turkish & French Coffee (hot), use Franco-style sugar levels (Sada, Alriha, Mazboot, Mano, Zeyada, Seryaosy) as these are prepared to order.
	- For Iced Drinks & Cold Chocolate (syrup-based):
		- Use syrup sugar levels:
			- 0% (No Added Sugar) = 0 pumps
			- 50% (Half-Sweet) = 1 pump
			- 100% (Standard) = 2 pumps
			- 150% (Extra-Sweet) = 3+ pumps ("Zeyada")
			- 200% (Ultra-Sweet)
		- This replaces the universal Franco list for these categories.

- **Espresso & Hot Coffee:**
	- Should NOT have size attribute (no S/M/L). Instead, use "Single", "Double", or "Triple" shot as variants if needed.
	- Should NOT have sugar attribute. Sugar is provided externally for hot drinks in cafes.
	- No flavor or temperature attributes unless truly needed.
- **Iced, Frappe, Smoothie, Soda, Milkshake:**
	- Should have standardized size (Small/Medium/Large) unless item is truly single-size.
	- Sugar attribute only if customer can choose (not for all sodas/milkshakes).
- **Tea:**
	- Should have sugar attribute (Franco style) for sweetened teas.
	- Size only if multiple sizes are offered.
- **General:**
	- Remove legacy/duplicate attributes (e.g., both "Size" and "size").
	- Remove or archive miscategorized/duplicate items.
	- Ensure all items are in correct category per mapping report.

---

## Error Reclassification

- Errors for missing sugar level on takeaway hot drinks (e.g., Espresso, Americano, Flat White, etc.) are NOT issues and should be ignored.
- Only Turkish & French Coffee (hot) require Franco sugar levels.
- Iced drinks and cold chocolate should use syrup sugar levels as described above.

---

## Summary by Severity

- 🔴 **ERRORS:** 14
- 🟡 **WARNINGS:** 17
- 🔵 **INFO:** 1

## Iced Category (16 issues)

### 🔴 Errors

#### Chai Latte (Hot) (ID: 848)
- **Type:** Missing Sugar Level
- **Description:** Iced items must have Sugar Level attribute

#### Chocolate (Hot) (ID: 849)
- **Type:** Missing Sugar Level
- **Description:** Iced items must have Sugar Level attribute

#### Cortado (ID: 842)
- **Type:** Missing Sugar Level
- **Description:** Iced items must have Sugar Level attribute


### 🟡 Warnings

#### Espresso (ID: 840)
- **Type:** Missing Size
- **Description:** Iced items typically have Size attribute

#### Flat White (ID: 843)
- **Type:** Missing Size
- **Description:** Iced items typically have Size attribute

#### Latte (ID: 846)
- **Type:** Missing Size
- **Description:** Iced items typically have Size attribute

#### Mocha (ID: 845)
- **Type:** Missing Size
- **Description:** Iced items typically have Size attribute

#### Settle Due (ID: 800)
- **Type:** Missing Size
- **Description:** Iced items typically have Size attribute

#### Settle Invoice (ID: 802)
- **Type:** Missing Size
- **Description:** Iced items typically have Size attribute

#### Spanish Latte (Hot) (ID: 847)
- **Type:** Missing Size
- **Description:** Iced items typically have Size attribute

## Frappe Category (6 issues)

### 🔴 Errors

#### Karak Chai (ID: 696)
- **Type:** Duplicate Size Attributes
- **Description:** Has both "Size" and "size" attributes - lowercase should be removed

#### Morning Bird Offer "Chai Latte" (ID: 783)
- **Type:** Duplicate Size Attributes
- **Description:** Has both "Size" and "size" attributes - lowercase should be removed

### 🟡 Warnings

#### Classic Teas (ID: 680)
- **Type:** Missing Size
- **Description:** Frappe items typically have Size attribute

#### Hibiscus (ID: 771)
- **Type:** Missing Size
- **Description:** Frappe items typically have Size attribute

#### Chai Flavours  (ID: 775)
- **Type:** Missing Size
- **Description:** Frappe items typically have Size attribute

#### Hibiscus Tea (ID: 852)
- **Type:** Missing Size
- **Description:** Frappe items typically have Size attribute

## Smoothie Category (4 issues)

### 🟡 Warnings

#### Classic Lemon Soda (ID: 824)
- **Type:** Missing Size
- **Description:** Smoothie items typically have Size attribute

#### Escobar Soda Drink (ID: 825)
- **Type:** Missing Size
- **Description:** Smoothie items typically have Size attribute

#### Mojito Soda (ID: 828)
- **Type:** Missing Size
- **Description:** Smoothie items typically have Size attribute

#### Power Soda +18 (ID: 827)
- **Type:** Missing Size
- **Description:** Smoothie items typically have Size attribute

## Soda Category (2 issues)

### 🔴 Errors

#### Raspberry & Pineapple (ID: 641)
- **Type:** Duplicate Size Attributes
- **Description:** Has both "Size" and "size" attributes - lowercase should be removed

#### Raspberry & Pineapple (ID: 641)
- **Type:** Corrupted Sugar Level
- **Description:** Sugar values: [Less Sugar, Half Sugar, Regular Sugar, Extra Sugar, No sugar] - Should be Franco-style: [Sada, Alriha, Mazboot, Mano, Zeyada, Seryaosy]

## Milkshake Category (4 issues)

### 🔴 Errors

#### Ice Flavors (ID: 776)
- **Type:** Corrupted Sugar Level
- **Description:** Sugar values: [Less Sugar, Half Sugar, Regular Sugar, Extra Sugar, No sugar] - Should be Franco-style: [Sada, Alriha, Mazboot, Mano, Zeyada, Seryaosy]

### 🟡 Warnings

#### Black Cat (ID: 866)
- **Type:** Missing Size
- **Description:** Milkshake items typically have Size attribute

#### Ice Flavors (ID: 776)
- **Type:** Missing Size
- **Description:** Milkshake items typically have Size attribute

### 🔵 Info

#### Ice Flavors (ID: 776)
- **Type:** Unusual Attribute
- **Description:** Has "Temperature" attribute - verify if needed


## Recommendations (Context-Aware)

### High Priority
1. **Espresso & Hot Coffee:** Remove all size and sugar attributes. If variants are needed, use "Single", "Double", "Triple" shot only.
2. **Hot Drinks:** Remove sugar attribute from all hot drinks (except tea). Sugar is provided externally.
3. **Duplicate Attributes:** Remove all duplicate/legacy attributes (e.g., both "Size" and "size").
4. **Corrupted Sugar Levels:** Standardize all sugar attributes to Franco-style values (Sada, Alriha, Mazboot, Mano, Zeyada, Seryaosy) where sugar is needed.
5. **Category Mapping:** Move/archive items per latest mapping report (phase5_mapping_report.json).

### Medium Priority
1. **Size Standardization:** Ensure all Iced, Frappe, Smoothie, Soda, and Milkshake items have correct size options (Small/Medium/Large) unless truly single-size.
2. **Tea:** Ensure all sweetened teas have Franco-style sugar attribute; remove from unsweetened teas.
3. **Unusual Attributes:** Remove or justify attributes like "Temperature", "Boba Toppings", "KINDER Quantity" unless required.

### Low Priority
1. **Legacy Cleanup:** Remove or archive all legacy/duplicate items and attributes.
2. **Descriptions & Images:** Add product descriptions and images in Odoo for all menu items.
3. **Stock & Pricing:** Review and update stock levels and pricing for accuracy.

---

## Next Steps

1. **Category-by-Category, Item-by-Item Review:**
	- Start with Coffee (Espresso, Americano, etc.), then proceed to Iced, Frappe, Smoothie, Soda, Milkshake, Tea, Food, Extras, Offers, Services.
	- For each item, verify attributes, category, and compliance with best practices above.
2. **Scripted Fixes:**
	- Use/refine TypeScript scripts to automate attribute cleanup, category moves, and legacy removal.
3. **Verification:**
	- After each category, run verification/discovery scripts and update this report.
4. **Documentation:**
	- Document all changes and rationale in markdown for future audits.

---


---

## Special Note: Espresso Shot Pricing

- When refactoring Espresso and similar items, ensure that each variant (Single, Double, Triple) is preserved as a distinct option with its correct price.
- Do NOT lose pricing information for any shot variant—each must be explicitly pulled from the system and tracked in the menu and scripts.
- When updating or scripting, always verify that all Espresso shot options and their prices are present and correct in the POS data and reflected in the final menu.

---

**This report is now context-aware and ready for the next refinement cycle.**

