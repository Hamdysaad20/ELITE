# POS Menu Refinement Plan (December 2025)

This plan follows the latest context-aware logic, best practices, and system mapping. Each step is category-by-category and item-by-item, with explicit checks for pricing, attributes, and preparation logic.

---

## 1. Coffee (Espresso, Americano, Flat White, etc.)
- Remove all size and sugar attributes from takeaway hot drinks (Espresso, Americano, Flat White, etc.).
- For Espresso, ensure variants for Single, Double, Triple exist, each with correct price.
- For Turkish & French Coffee, ensure Franco-style sugar levels (Sada, Alriha, Mazboot, Mano, Zeyada, Seryaosy) are present.
- Remove any legacy or duplicate attributes (e.g., both "Size" and "size").
- Verify all items are in the correct category per mapping.

## 2. Iced Drinks
- Ensure all items have standardized size (Small/Medium/Large) unless truly single-size.
- Replace Franco sugar levels with syrup sugar levels (0%, 50%, 100%, 150%, 200%).
- Remove unnecessary or legacy attributes.
- Verify pricing and category mapping.

## 3. Frappe
- Standardize size attributes (Small/Medium/Large).
- Use syrup sugar levels as above.
- Remove legacy/duplicate attributes.
- Verify pricing and mapping.

## 4. Smoothie
- Standardize size attributes.
- Remove sugar attribute unless customer can choose.
- Remove legacy/duplicate attributes.
- Verify pricing and mapping.

## 5. Soda
- Standardize size attributes.
- Remove sugar attribute unless customer can choose.
- Remove legacy/duplicate attributes.
- Verify pricing and mapping.

## 6. Milkshake
- Standardize size attributes.
- Remove sugar attribute unless customer can choose.
- Remove legacy/duplicate attributes.
- Verify pricing and mapping.

## 7. Tea
- For sweetened teas, ensure Franco-style sugar levels are present.
- Remove sugar attribute from unsweetened teas.
- Standardize size attributes if multiple sizes are offered.
- Remove legacy/duplicate attributes.
- Verify pricing and mapping.

## 8. Food, Extras, Offers, Services
- Remove any beverage-specific attributes (size, sugar, etc.).
- Verify all items are in the correct category per mapping.
- Remove legacy/duplicate attributes.
- Verify pricing and mapping.

---

## General Steps for Each Category
1. Run discovery script to list all items and attributes.
2. For each item:
   - Check and update attributes as per above logic.
   - Ensure correct pricing for all variants (especially Espresso shots).
   - Move/archive items as per mapping report.
   - Remove legacy/duplicate attributes.
3. After edits, run verification script and update the issues report.
4. Document all changes in markdown for audit trail.

---

**This plan should be executed category-by-category, item-by-item, with verification after each step.**
