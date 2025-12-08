# Adding Services Category with Subcategories

This guide will help you add the Services category with 100 subcategories to your marketplace database.

## Step-by-Step Instructions

### Step 1: Add Subcategories Table
First, you need to create the `subcategories` table in your database.

1. Open your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Open the file `/database/add_subcategories_table.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run**

This will:
- Create the `subcategories` table
- Add necessary indexes for performance
- Enable Row Level Security (RLS)
- Add a `subcategory_id` column to the `listings` table
- Set up proper foreign key relationships

### Step 2: Add Services Category & All Subcategories
After the subcategories table is created, add the Services category.

1. Still in the **SQL Editor**
2. Open the file `/database/add_services_category.sql`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **Run**

This will:
- Add the "Services" category with 🔧 icon
- Add all 100 subcategories including:
  - Home Services (Locksmith, Handyman, HVAC, Plumbing, Electrical, etc.)
  - Auto Services (Mechanic, Car Wash, Auto Body, Windshield Replacement, etc.)
  - Professional Services (Lawyer, Accountant, Consultant, Marketing, etc.)
  - Personal Services (Hair/Nails, Fitness Coach, Photographer, etc.)
  - Pet Services (Veterinary, Pet Training, Pet Grooming, etc.)
  - Food & Beverage (Catering, Restaurant, Bakery, Coffee Shop, etc.)
  - Health Services (Medical, Dental, Chiropractor, Physical Therapy, etc.)
  - And many more!

### Step 3: Verify Installation
The script includes verification queries that will show:
- The Services category with the count of subcategories (should be 100)
- A list of all subcategories with their names and slugs

## What's Next?

After running these scripts:
- The Services category will appear in your category list
- Users can create listings under the Services category
- You can filter listings by subcategory
- The admin panel will show analytics for Services listings

## Troubleshooting

**If you get an error about tables already existing:**
- The scripts use `IF NOT EXISTS` and `ON CONFLICT` clauses
- They are safe to run multiple times
- They will update existing records instead of failing

**If you need to remove the Services category:**
```sql
DELETE FROM categories WHERE slug = 'services';
-- This will also delete all subcategories due to CASCADE
```

## Database Structure

After running these scripts, your database will have:
- `categories` table - Main categories (Cars, Real Estate, Electronics, Services, etc.)
- `subcategories` table - Subcategories within each category
- `listings` table - Now includes `subcategory_id` for detailed categorization

Each listing can belong to:
- One category (required)
- One subcategory (optional)
