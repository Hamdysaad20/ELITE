# POS Cashier View Optimization Plan

**Goal:** Create a streamlined, production-ready POS interface for Elite Coffee that minimizes clicks, prevents errors, and handles complex customization (toppings, milk, shots) intuitively.

## 1. Core Philosophy: "Product Families"
Instead of treating every product individually, we group them into families with shared attribute rules. This ensures consistency.

| Family | Examples | Key Attributes | Default Behavior |
|--------|----------|----------------|------------------|
| **Black Coffee** | Americano, Espresso, Turkish | Size, Sugar, Bean Type (opt) | No Milk, No Flavor by default |
| **White Coffee** | Latte, Cappuccino, Flat White | Size, Milk, Espresso Shots, Flavor | Whole Milk, 2 Shots (Reg) |
| **Frappe** | Caramel Frappe, Mocha Frappe | Size, Milk, Whip, Drizzle | Whole Milk, Whip, Drizzle included |
| **Milkshake** | Vanilla, Chocolate | Size, Milk, Whip, Thickness | Whole Milk, Whip included |
| **Smoothie** | Mango, Berry | Size, Extras | No Milk (Fruit base) |
| **Boba** | Brown Sugar, Taro | Size, Sugar, Ice, Toppings | Standard Ice/Sugar |
| **Tea** | Earl Grey, Green | Size, Sugar | No Milk by default |

---

## 2. Attribute Cleanup & Standardization

### A. Espresso Shots (Consolidate)
*Current Issues:* Duplicates (`no` vs `No Shot`), formatting (`double  shot`).
*Action:* Archive old values, create standard set.
* **Standard Values:**
    * `No Shot` (for decaf/kids or mistakes)
    * `Single Shot`
    * `Double Shot` (Standard for most Med/Large)
    * `Triple Shot` (+Extra)
    * `Quad Shot` (+Extra)

### B. Milk Options
*Current Issues:* Generic `milk` value, missing `No Milk`.
*Action:* Rename/Archive generic `milk`. Add `No Milk`.
* **Standard Values:**
    * `No Milk` (Crucial for Americano/Black Coffee if attribute is present)
    * `Whole Milk` (Default)
    * `Skim Milk` (Low Fat)
    * `Oat Milk` (+$)
    * `Almond Milk` (+$)
    * `Coconut Milk` (+$)
    * `Breve` (Half & Half) - *Optional if needed*

### C. Flavor (Syrups)
*Current Issues:* Inconsistent casing (`Caramel` vs `caramel`), typos (`pinaple`), missing `No Flavor`.
*Action:* Standardize casing (Title Case), fix typos, add `No Flavor`.
* **Standard Values:**
    * `No Flavor` (Default for most)
    * `Vanilla`
    * `Caramel`
    * `Hazelnut`
    * `White Chocolate`
    * `Dark Chocolate`
    * `Salted Caramel`
    * `Irish Cream`
    * ... (Fruit flavors for Sodas/Teas: `Strawberry`, `Mango`, `Peach`, `Passion Fruit`)

### D. Toppings & Extras (New/Refined)
*Current Issues:* Missing Marshmallow, unclear "Extras".
*Action:* Create a dedicated **"Toppings"** attribute for physical add-ons (not syrups).
* **Values:**
    * `No Toppings`
    * `Whipped Cream` (if not separate attr)
    * `Marshmallow` (New)
    * `Chocolate Chips`
    * `Caramel Sauce` (Drizzle)
    * `Chocolate Sauce` (Drizzle)
    * `Strawberry Puree`
    * `Tapioca Pearls` (Boba)
    * `Popping Boba`
    * `Coconut Jelly`

---

## 3. Specific Product Configurations (The "Recipe" View)

### ☕ Americano / Long Black
* **Attributes:** `Size`, `Espresso Shots`, `Sugar Level`, `Milk` (Optional)
* **Defaults:**
    * Milk: `No Milk` (Selected by default)
    * Shots: `Double Shot`
    * Sugar: `No Sugar`

### 🥛 Latte / Cappuccino
* **Attributes:** `Size`, `Milk`, `Espresso Shots`, `Flavor`, `Sugar Level`
* **Defaults:**
    * Milk: `Whole Milk`
    * Shots: `Double Shot`
    * Flavor: `No Flavor`

### 🍫 Hot Chocolate
* **Attributes:** `Size`, `Milk`, `Toppings` (Marshmallow!), `Sugar Level`
* **Defaults:**
    * Milk: `Whole Milk`
    * Toppings: `Marshmallow` (or `No Toppings`)

### 🥤 Frappe
* **Attributes:** `Size`, `Milk`, `Whipped Cream`, `Drizzle`, `Espresso Shots` (Optional extra)
* **Defaults:**
    * Whip: `Regular Whip`
    * Drizzle: `Caramel` (for Caramel Frappe) or `Chocolate` (for Mocha)

---

## 4. Attribute Guardrails & Add-on Rules

| Family | Base Recipe | Max Extra Shots | Milk Logic | Flavor Logic | Physical Toppings |
|--------|-------------|-----------------|------------|--------------|-------------------|
| **Americano / Long Black** | 2 espresso shots + hot water | `0` (already max) | `No Milk` default, allow splash by selecting `Whole` | Only allow `No Flavor` (disable others) | None |
| **Espresso (Single/Double/Macchiato)** | 1-2 shots | `+1` (Triple max) | Not exposed | Not exposed | `Foam` only for Macchiato |
| **Latte / Cappuccino / Flat White** | 2 espresso shots + steamed milk | `+2` (Quad max) | `Whole` default, alt milks optional | All syrup flavors, but `No Flavor` default | `Foam` auto (Capp), `Foam Optional` (Latte) |
| **Spanish Latte** | Condensed milk base | `0` (recipe locked) | `Whole Milk` only | `No Flavor` (already sweet) | `Foam Optional` |
| **Mocha / Chocolate (Hot/Iced)** | Chocolate sauce + milk | `+1` (Extra shot) | `Whole Milk` default, alt allowed | Limit to `Chocolate` or `No Flavor` | `Marshmallow` + `Whip` allowed |
| **Frappe** | Coffee/cream base | `+1` shot | `Whole Milk` default, other milks optional | Match drink name (e.g., Caramel Frappe auto selects `Caramel`) | Require `Whip` + `Drizzle`, allow `Marshmallow` add-on |
| **Milkshake** | Ice cream + milk | Shots hidden | `Whole Milk` default (can allow `No Milk` for vegan) | Fruit/candy flavors only | `Whip` optional, `No Foam` |
| **Smoothie** | Fruit + ice | Shots hidden | No milk attribute | Fruit flavors only | Use `Extras` attribute (Protein, Chia, etc.) |
| **Boba / Signature Cold Drinks** | Milk tea + toppings | Shots hidden except `Boba Spanish Latte (+1)` | `Whole` default, alt milks optional | Limit to core flavors per drink | Must offer `Tapioca`, `Popping Boba`, `Coconut Jelly` |
| **Tea** | Tea bag + water | Shots hidden | Milk hidden (except Chai/Matcha) | Tea-specific flavors | `Foam` not allowed |

> ✅ These guardrails will be encoded when we re-seed attribute lines: instead of every product exposing all attributes, each line will explicitly list only the allowed values.

---

## 5. Cashier Recipe Matrix (Top Movers)

| Product | Family | Base Shots | Allowed Add Shots | Milk Defaults | Flavor Defaults | Allowed Toppings |
|---------|--------|------------|-------------------|---------------|-----------------|------------------|
| Americano | Black Coffee | 2 | None | `No Milk` (can add splash) | `No Flavor` only | None |
| Spanish Latte (Hot/Iced) | White Coffee | 2 | None | `Whole Milk` + condensed | `No Flavor` | `Foam Optional` |
| Latte | White Coffee | 2 | Up to `Quad` | `Whole Milk` default, alt milks | Any flavor (default `No`) | `Foam Optional` |
| Cappuccino | White Coffee | 2 | Up to `Triple` | `Whole Milk` | `No Flavor` default | `Foam Required` |
| Flat White | White Coffee | 2 ristretto | +1 | `Whole Milk` microfoam | `No Flavor` | `Foam Fixed` |
| Mocha (Hot/Iced) | Mocha | 1 shot + chocolate | +1 | `Whole Milk` | `Chocolate` locked | `Whip`, `Marshmallow` |
| Hot Chocolate | Chocolate | 0 | n/a | `Whole Milk` | `Chocolate` locked | `Marshmallow`, `Whip` |
| Caramel Frappé | Frappe | 1 | +1 | `Whole Milk` | `Caramel` locked | `Whip`, `Caramel Drizzle`, `Marshmallow` |
| Mocha Frappé | Frappe | 1 | +1 | `Whole Milk` | `Chocolate` locked | `Whip`, `Chocolate Drizzle`, `Marshmallow` |
| Brown Sugar BOBA | Boba | 0 | n/a | `Whole Milk` | `Brown Sugar` syrup locked | `Tapioca`, `Popping Boba`, `Cheese Foam` |
| Taro Boba | Boba | 0 | n/a | `Whole Milk` | `Taro` locked | `Tapioca` + `Coconut Jelly` |
| Matcha Latte (Hot/Iced) | Tea/Matcha | 0 | n/a | `Whole Milk` | `Matcha` locked | `Foam Optional` |

This matrix is what the cashier cheat-sheet will display so that "max shot" or "topping" questions are answered instantly.

---

## 6. Implementation Plan

### Step 1: Value Standardization (Script)
1.  **Rename/Merge** duplicate attribute values (e.g., merge `no` -> `No Shot`).
2.  **Create Missing Values**: `No Flavor`, `No Milk`, `Marshmallow`.
3.  **Fix Typos**: `pinaple` -> `Pineapple`.

### Step 2: Attribute Application (Script)
1.  **Apply "No X" defaults**: Ensure products have the "No" option available.
2.  **Configure "Toppings"**: Add the Toppings attribute to Hot Chocolate, Frappes, etc.

### Step 3: Boba Category Setup (Script)
1.  ✅ Create `Boba` category (ID 27) with same parent as Iced.
2.  ✅ Move Boba drinks (BOBA Chocolate, BOBA Spanish latte, `[Taro] Boba/Bubble`, Brown Sugar BOBA, Bestie offers).
3.  ✅ Apply dedicated `Boba Toppings` attribute (No Toppings, Tapioca Pearls, Coconut Jelly, Popping Boba, Cheese Foam).

### Step 4: Final Review
1.  Generate a "Menu Matrix" showing every product and its configured attributes/defaults for user sign-off.

---

## 7. Questions for User
1.  **Marshmallow**: Should this be a free addition or paid extra?
2.  **Toppings**: Do you want separate attributes for "Drizzle", "Whip", "Foam" (current state) OR combine them into a single "Toppings" list where you can select multiple?
    *   *Current:* Separate attributes (Good for structured workflows).
    *   *Combined:* "Toppings" (Good for flexibility, e.g., "Add Whip AND Marshmallow AND Drizzle").
3.  **Americano Milk**: Do you charge for adding a splash of milk to Americano?

