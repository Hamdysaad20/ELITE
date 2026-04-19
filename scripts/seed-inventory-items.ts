import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ItemSeed {
  name: string;
  nameAr: string;
  section: string;
  subsection?: string;
  unit: string;
  unitAr: string;
  countMethod: string;
  packSize: number;
  isDailyBarCounted: boolean;
  isStorageCounted: boolean;
  sortOrder: number;
  minimumStock: number;
  alertLevel: number;
  maximumStock: number;
}

const items: ItemSeed[] = [
  // ─── أكواب وتغليف (Cups & Packaging) ────────────────────────
  { name: "Cup 16oz Cold", nameAr: "كاب ١٦ أونز بارد", section: "cups_packaging", unit: "piece", unitAr: "حبة", countMethod: "column_pair", packSize: 50, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 1, minimumStock: 100, alertLevel: 200, maximumStock: 1000 },
  { name: "Cup 14oz Cold", nameAr: "كاب ١٤ أونص بارد", section: "cups_packaging", unit: "piece", unitAr: "حبة", countMethod: "column_pair", packSize: 50, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 2, minimumStock: 100, alertLevel: 200, maximumStock: 1000 },
  { name: "Cup 12oz Hot", nameAr: "كاب هوت ١٢ أونز", section: "cups_packaging", unit: "piece", unitAr: "حبة", countMethod: "column_pair", packSize: 50, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 3, minimumStock: 50, alertLevel: 100, maximumStock: 500 },
  { name: "Cup 8oz Hot", nameAr: "كاب هوت ٨ أونز", section: "cups_packaging", unit: "piece", unitAr: "حبة", countMethod: "column_pair", packSize: 50, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 4, minimumStock: 50, alertLevel: 100, maximumStock: 500 },
  { name: "Plastic Lids", nameAr: "أغطية بلاستيك", section: "cups_packaging", unit: "piece", unitAr: "حبة", countMethod: "column_pair", packSize: 50, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 5, minimumStock: 100, alertLevel: 200, maximumStock: 1000 },
  { name: "Hot Lids", nameAr: "أغطية هوت", section: "cups_packaging", unit: "piece", unitAr: "حبة", countMethod: "column_pair", packSize: 50, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 6, minimumStock: 50, alertLevel: 100, maximumStock: 500 },
  { name: "Dome Lids", nameAr: "أغطية دوم", section: "cups_packaging", unit: "piece", unitAr: "حبة", countMethod: "column_pair", packSize: 50, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 7, minimumStock: 50, alertLevel: 100, maximumStock: 500 },
  { name: "Straws", nameAr: "شاليموه", section: "cups_packaging", unit: "piece", unitAr: "حبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 8, minimumStock: 50, alertLevel: 100, maximumStock: 500 },
  { name: "Cup Sleeves", nameAr: "سليف أكواب", section: "cups_packaging", unit: "piece", unitAr: "حبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 9, minimumStock: 30, alertLevel: 60, maximumStock: 300 },
  { name: "Napkins", nameAr: "مناديل", section: "cups_packaging", unit: "pack", unitAr: "باكت", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 10, minimumStock: 5, alertLevel: 10, maximumStock: 50 },
  { name: "Takeaway Bags Small", nameAr: "أكياس تيك أواي صغير", section: "cups_packaging", unit: "piece", unitAr: "حبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 11, minimumStock: 20, alertLevel: 50, maximumStock: 200 },
  { name: "Takeaway Bags Large", nameAr: "أكياس تيك أواي كبير", section: "cups_packaging", unit: "piece", unitAr: "حبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 12, minimumStock: 20, alertLevel: 50, maximumStock: 200 },

  // ─── سيرب وصوصات (Syrups & Sauces) ─────────────────────────
  { name: "Vanilla Syrup", nameAr: "سيرب فانيليا", section: "syrups_sauces", subsection: "syrup", unit: "bottle", unitAr: "زجاجة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 1, minimumStock: 1, alertLevel: 2, maximumStock: 10 },
  { name: "Caramel Syrup Jumbo", nameAr: "سيرب كراميل جامبو", section: "syrups_sauces", subsection: "syrup", unit: "bottle", unitAr: "زجاجة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 2, minimumStock: 1, alertLevel: 2, maximumStock: 10 },
  { name: "Hazelnut Syrup", nameAr: "سيرب هازلنت", section: "syrups_sauces", subsection: "syrup", unit: "bottle", unitAr: "زجاجة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 3, minimumStock: 1, alertLevel: 2, maximumStock: 10 },
  { name: "Chocolate Syrup", nameAr: "سيرب شوكولاتة", section: "syrups_sauces", subsection: "syrup", unit: "bottle", unitAr: "زجاجة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 4, minimumStock: 1, alertLevel: 2, maximumStock: 10 },
  { name: "French Vanilla Syrup", nameAr: "سيرب فرنش فانيليا", section: "syrups_sauces", subsection: "syrup", unit: "bottle", unitAr: "زجاجة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 5, minimumStock: 1, alertLevel: 2, maximumStock: 10 },
  { name: "Lavender Syrup", nameAr: "سيرب لافندر", section: "syrups_sauces", subsection: "syrup", unit: "bottle", unitAr: "زجاجة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 6, minimumStock: 1, alertLevel: 2, maximumStock: 10 },
  { name: "Strawberry Sauce", nameAr: "صوص فراولة", section: "syrups_sauces", subsection: "sauce", unit: "bottle", unitAr: "زجاجة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 7, minimumStock: 1, alertLevel: 2, maximumStock: 10 },
  { name: "Caramel Sauce", nameAr: "صوص كراميل", section: "syrups_sauces", subsection: "sauce", unit: "bottle", unitAr: "زجاجة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 8, minimumStock: 1, alertLevel: 2, maximumStock: 10 },
  { name: "Chocolate Sauce", nameAr: "صوص شوكولاتة", section: "syrups_sauces", subsection: "sauce", unit: "bottle", unitAr: "زجاجة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 9, minimumStock: 1, alertLevel: 2, maximumStock: 10 },
  { name: "White Chocolate Sauce", nameAr: "صوص وايت شوكولاتة", section: "syrups_sauces", subsection: "sauce", unit: "bottle", unitAr: "زجاجة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 10, minimumStock: 1, alertLevel: 2, maximumStock: 10 },

  // ─── كراشات ومساحيق (Crushes & Powders) ─────────────────────
  { name: "Taro Powder", nameAr: "بودر تارو", section: "crushes_powders", unit: "bag", unitAr: "كيس", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 1, minimumStock: 1, alertLevel: 2, maximumStock: 10 },
  { name: "Strawberry Crush", nameAr: "كراش فراولة", section: "crushes_powders", unit: "bag", unitAr: "كيس", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 2, minimumStock: 1, alertLevel: 2, maximumStock: 10 },
  { name: "Mango Crush", nameAr: "كراش مانجو", section: "crushes_powders", unit: "bag", unitAr: "كيس", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 3, minimumStock: 1, alertLevel: 2, maximumStock: 10 },
  { name: "Mixed Berry Crush", nameAr: "كراش مكس بيري", section: "crushes_powders", unit: "bag", unitAr: "كيس", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 4, minimumStock: 1, alertLevel: 2, maximumStock: 10 },
  { name: "Matcha Powder", nameAr: "بودر ماتشا", section: "crushes_powders", unit: "bag", unitAr: "كيس", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 5, minimumStock: 1, alertLevel: 2, maximumStock: 10 },
  { name: "Spanish Latte Powder", nameAr: "بودر سبانش لاتيه", section: "crushes_powders", unit: "bag", unitAr: "كيس", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 6, minimumStock: 1, alertLevel: 2, maximumStock: 10 },
  { name: "Hot Chocolate Powder", nameAr: "بودر هوت شوكولاتة", section: "crushes_powders", unit: "bag", unitAr: "كيس", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 7, minimumStock: 1, alertLevel: 2, maximumStock: 10 },

  // ─── جيلو وتوبينج (Jello & Toppings) ───────────────────────
  { name: "Boba Pearls", nameAr: "حبات بوبا", section: "jello_toppings", unit: "kg", unitAr: "كيلو", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 1, minimumStock: 1, alertLevel: 3, maximumStock: 15 },
  { name: "Jello Strawberry", nameAr: "جيلي فراولة", section: "jello_toppings", unit: "piece", unitAr: "حبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 2, minimumStock: 5, alertLevel: 10, maximumStock: 30 },
  { name: "Jello Mango", nameAr: "جيلي مانجو", section: "jello_toppings", unit: "piece", unitAr: "حبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 3, minimumStock: 5, alertLevel: 10, maximumStock: 30 },
  { name: "Whipped Cream", nameAr: "ويب كريم", section: "jello_toppings", unit: "can", unitAr: "علبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 4, minimumStock: 2, alertLevel: 4, maximumStock: 15 },
  { name: "Oreo Crumbs", nameAr: "أوريو مكسر", section: "jello_toppings", unit: "pack", unitAr: "باكت", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 5, minimumStock: 2, alertLevel: 4, maximumStock: 15 },
  { name: "Lotus Crumbs", nameAr: "لوتس مكسر", section: "jello_toppings", unit: "pack", unitAr: "باكت", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 6, minimumStock: 2, alertLevel: 4, maximumStock: 15 },
  { name: "Kinder Pieces", nameAr: "قطع كيندر", section: "jello_toppings", unit: "pack", unitAr: "باكت", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 7, minimumStock: 2, alertLevel: 4, maximumStock: 15 },

  // ─── قهوة ومشروبات (Coffee & Beverages) ─────────────────────
  { name: "Espresso Beans", nameAr: "بُن إسبريسو", section: "coffee_beverages", unit: "kg", unitAr: "كيلو", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 1, minimumStock: 2, alertLevel: 5, maximumStock: 20 },
  { name: "Turkish Coffee", nameAr: "بُن تركي", section: "coffee_beverages", unit: "kg", unitAr: "كيلو", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 2, minimumStock: 1, alertLevel: 3, maximumStock: 10 },
  { name: "Fresh Milk", nameAr: "لبن فريش", section: "coffee_beverages", unit: "liter", unitAr: "لتر", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 3, minimumStock: 5, alertLevel: 10, maximumStock: 30 },
  { name: "Condensed Milk", nameAr: "لبن مكثف", section: "coffee_beverages", unit: "can", unitAr: "علبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 4, minimumStock: 2, alertLevel: 5, maximumStock: 15 },
  { name: "Evaporated Milk", nameAr: "لبن مبخر", section: "coffee_beverages", unit: "can", unitAr: "علبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 5, minimumStock: 2, alertLevel: 5, maximumStock: 15 },
  { name: "Powder Milk", nameAr: "لبن بودر", section: "coffee_beverages", unit: "bag", unitAr: "كيس", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 6, minimumStock: 1, alertLevel: 3, maximumStock: 10 },
  { name: "Sugar", nameAr: "سكر", section: "coffee_beverages", unit: "kg", unitAr: "كيلو", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 7, minimumStock: 2, alertLevel: 5, maximumStock: 25 },
  { name: "Sugar Sticks", nameAr: "سكر ستيك", section: "coffee_beverages", unit: "box", unitAr: "علبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 8, minimumStock: 1, alertLevel: 3, maximumStock: 10 },
  { name: "Tea Bags", nameAr: "شاي أكياس", section: "coffee_beverages", unit: "box", unitAr: "علبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 9, minimumStock: 1, alertLevel: 3, maximumStock: 10 },
  { name: "Nescafe", nameAr: "نسكافيه", section: "coffee_beverages", unit: "jar", unitAr: "برطمان", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 10, minimumStock: 1, alertLevel: 2, maximumStock: 5 },
  { name: "Red Bull Original", nameAr: "ريد بول عادي", section: "coffee_beverages", unit: "can", unitAr: "علبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 11, minimumStock: 6, alertLevel: 12, maximumStock: 48 },
  { name: "Red Bull Sugar Free", nameAr: "ريد بول شوجر فري", section: "coffee_beverages", unit: "can", unitAr: "علبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 12, minimumStock: 6, alertLevel: 12, maximumStock: 48 },
  { name: "Water Bottles", nameAr: "مياه معدنية", section: "coffee_beverages", unit: "carton", unitAr: "كرتونة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 13, minimumStock: 2, alertLevel: 4, maximumStock: 15 },
  { name: "Ice", nameAr: "ثلج", section: "coffee_beverages", unit: "bag", unitAr: "كيس", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 14, minimumStock: 2, alertLevel: 4, maximumStock: 10 },

  // ─── حلويات وإضافات (Sweets & Additions) ────────────────────
  { name: "Croissant Plain", nameAr: "كرواسون سادة", section: "sweets_additions", unit: "piece", unitAr: "حبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 1, minimumStock: 5, alertLevel: 10, maximumStock: 30 },
  { name: "Croissant Chocolate", nameAr: "كرواسون شوكولاتة", section: "sweets_additions", unit: "piece", unitAr: "حبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 2, minimumStock: 5, alertLevel: 10, maximumStock: 30 },
  { name: "Croissant Zaatar", nameAr: "كرواسون زعتر", section: "sweets_additions", unit: "piece", unitAr: "حبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 3, minimumStock: 5, alertLevel: 10, maximumStock: 30 },
  { name: "Cookie Chocolate Chip", nameAr: "كوكيز شوكولاتة", section: "sweets_additions", unit: "piece", unitAr: "حبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 4, minimumStock: 5, alertLevel: 10, maximumStock: 30 },
  { name: "Brownie", nameAr: "براوني", section: "sweets_additions", unit: "piece", unitAr: "حبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 5, minimumStock: 3, alertLevel: 6, maximumStock: 20 },
  { name: "Cinnabon", nameAr: "سينابون", section: "sweets_additions", unit: "piece", unitAr: "حبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 6, minimumStock: 3, alertLevel: 6, maximumStock: 20 },

  // ─── فواكه طازجة (Fresh Fruits) ─────────────────────────────
  { name: "Strawberries", nameAr: "فراولة", section: "fresh_fruits", unit: "kg", unitAr: "كيلو", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 1, minimumStock: 1, alertLevel: 2, maximumStock: 8 },
  { name: "Bananas", nameAr: "موز", section: "fresh_fruits", unit: "kg", unitAr: "كيلو", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 2, minimumStock: 1, alertLevel: 2, maximumStock: 8 },
  { name: "Mango (Frozen)", nameAr: "مانجو مجمد", section: "fresh_fruits", unit: "kg", unitAr: "كيلو", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 3, minimumStock: 1, alertLevel: 3, maximumStock: 10 },
  { name: "Lemons", nameAr: "ليمون", section: "fresh_fruits", unit: "kg", unitAr: "كيلو", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 4, minimumStock: 1, alertLevel: 2, maximumStock: 5 },
  { name: "Mint", nameAr: "نعناع", section: "fresh_fruits", unit: "bundle", unitAr: "حزمة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 5, minimumStock: 1, alertLevel: 2, maximumStock: 5 },

  // ─── منظفات ومستلزمات (Cleaning & Supplies) ─────────────────
  { name: "Dish Soap", nameAr: "صابون غسيل", section: "cleaning_supplies", unit: "bottle", unitAr: "زجاجة", countMethod: "direct", packSize: 1, isDailyBarCounted: false, isStorageCounted: true, sortOrder: 1, minimumStock: 1, alertLevel: 2, maximumStock: 10 },
  { name: "Cleaning Cloths", nameAr: "فوط تنظيف", section: "cleaning_supplies", unit: "piece", unitAr: "حبة", countMethod: "direct", packSize: 1, isDailyBarCounted: false, isStorageCounted: true, sortOrder: 2, minimumStock: 5, alertLevel: 10, maximumStock: 30 },
  { name: "Surface Cleaner", nameAr: "منظف أسطح", section: "cleaning_supplies", unit: "bottle", unitAr: "زجاجة", countMethod: "direct", packSize: 1, isDailyBarCounted: false, isStorageCounted: true, sortOrder: 3, minimumStock: 1, alertLevel: 2, maximumStock: 5 },
  { name: "Trash Bags Large", nameAr: "أكياس زبالة كبير", section: "cleaning_supplies", unit: "roll", unitAr: "رول", countMethod: "direct", packSize: 1, isDailyBarCounted: false, isStorageCounted: true, sortOrder: 4, minimumStock: 2, alertLevel: 4, maximumStock: 15 },
  { name: "Trash Bags Small", nameAr: "أكياس زبالة صغير", section: "cleaning_supplies", unit: "roll", unitAr: "رول", countMethod: "direct", packSize: 1, isDailyBarCounted: false, isStorageCounted: true, sortOrder: 5, minimumStock: 2, alertLevel: 4, maximumStock: 15 },
  { name: "Paper Towels", nameAr: "مناديل ورقية", section: "cleaning_supplies", unit: "roll", unitAr: "رول", countMethod: "direct", packSize: 1, isDailyBarCounted: false, isStorageCounted: true, sortOrder: 6, minimumStock: 2, alertLevel: 5, maximumStock: 20 },
  { name: "Hand Sanitizer", nameAr: "معقم يدين", section: "cleaning_supplies", unit: "bottle", unitAr: "زجاجة", countMethod: "direct", packSize: 1, isDailyBarCounted: false, isStorageCounted: true, sortOrder: 7, minimumStock: 1, alertLevel: 2, maximumStock: 5 },
  { name: "Gloves Box", nameAr: "علبة جوانتي", section: "cleaning_supplies", unit: "box", unitAr: "علبة", countMethod: "direct", packSize: 1, isDailyBarCounted: false, isStorageCounted: true, sortOrder: 8, minimumStock: 1, alertLevel: 2, maximumStock: 10 },

  // ─── أخرى (Other) ──────────────────────────────────────────
  { name: "Cashier Roll", nameAr: "رول كاشير", section: "other", unit: "roll", unitAr: "رول", countMethod: "direct", packSize: 1, isDailyBarCounted: false, isStorageCounted: true, sortOrder: 1, minimumStock: 2, alertLevel: 4, maximumStock: 15 },
  { name: "Wooden Stirrers", nameAr: "عيدان تقليب", section: "other", unit: "pack", unitAr: "باكت", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 2, minimumStock: 2, alertLevel: 4, maximumStock: 15 },
  { name: "Plastic Spoons", nameAr: "معالق بلاستيك", section: "other", unit: "pack", unitAr: "باكت", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 3, minimumStock: 2, alertLevel: 4, maximumStock: 15 },
  { name: "Sauce Cups Small", nameAr: "أكواب صوص صغيرة", section: "other", unit: "piece", unitAr: "حبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 4, minimumStock: 20, alertLevel: 40, maximumStock: 200 },
  { name: "Cup Holders (Carrier)", nameAr: "حامل أكواب", section: "other", unit: "piece", unitAr: "حبة", countMethod: "direct", packSize: 1, isDailyBarCounted: true, isStorageCounted: true, sortOrder: 5, minimumStock: 10, alertLevel: 20, maximumStock: 100 },
];

async function main() {
  console.log("Seeding inventory items...");

  let created = 0;
  let skipped = 0;

  for (const item of items) {
    const existing = await prisma.inventoryItem.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.inventoryItem.create({ data: item });
    created++;
  }

  console.log(`Done: ${created} created, ${skipped} skipped (already exist).`);
  console.log(`Total items in seed: ${items.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
