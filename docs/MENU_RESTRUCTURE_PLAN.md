# Menu Restructuring & Pricing Plan

## 1. Current Status Analysis
*   **Active Products:** ~143 products.
*   **Archived Products:** 257 products (mostly old variants like "Latte [L]", "Latte [M]").
*   **Current Issue:** Options (Milk, Shots) exist but have **no extra price** configured.
*   **Goal:** Implement a robust system where options have specific costs (e.g., Oat Milk +5 LE).

## 2. The "Master Configuration" Approach
Instead of guessing, we will define a strict rule set for each category.

### Proposed Category Structure

| Category | Required Attributes | Optional Attributes | Pricing Rules (Example) |
| :--- | :--- | :--- | :--- |
| **Hot Coffee** | Size, Milk | Espresso Shots, Syrups | Oat Milk (+5), Double Shot (+10), Syrup (+5) |
| **Iced Coffee** | Size, Milk | Espresso Shots, Syrups, Ice Level | Same as Hot |
| **Frappe** | Size, Milk | Espresso Shots, Whipped Cream | Whipped Cream (+5) |
| **Boba / Bubble** | Size, Sugar, Ice | Toppings (Boba/Jelly) | Extra Boba (+10) |
| **Tea** | Size | Sugar Level, Mint | Mint (+2) |
| **Milkshakes** | Size | Whipped Cream | - |

## 3. Detailed Attribute & Pricing Map
*Confirmed Prices as of Dec 7, 2025*

### A. Milk Options (Attribute ID: 27)
*   **Whole Milk:** +0 LE (Default)
*   **Oat Milk:** +25 LE
*   **Almond Milk:** +25 LE
*   **Coconut Milk:** +25 LE

### B. Espresso Shots (Attribute ID: 12)
*   **Single Shot:** +20 LE
*   **Double Shot:** +35 LE
*   **Triple Shot:** +45 LE

### C. Syrups / Flavors (Attribute ID: 15)
*   **Vanilla, Caramel, Hazelnut:** +15 LE each

### D. Boba Toppings
*   **Tapioca Pearls:** +30 LE
*   **Boba Extra:** +30 LE

### E. Size Options
*   **Small:** Base Price (+0 LE)
*   **Medium:** +10 LE
*   **Large:** +20 LE

### F. Ice Level
*   **Regular Ice:** +0 LE
*   **No Ice:** +10 LE (Extra ingredients)

### G. Sugar Level
*   **0%, 25%, 50%, 100%:** +0 LE
