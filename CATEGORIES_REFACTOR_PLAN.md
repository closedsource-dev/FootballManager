# Categories Refactor Plan

## Overview
Replace the Money Goals/Allocations system with a simpler Categories system where users can allocate money into different categories.

## What's Been Done

### 1. ✅ Backend Changes
- Created `lib/categories.ts` with functions:
  - `getCategories()` - Get all categories for user
  - `createCategory()` - Create new category
  - `deleteCategory()` - Delete category
  - `addToCategory()` - Add money to category
  - `removeFromCategory()` - Remove money from category

- Updated `lib/payments.ts`:
  - Removed goal-related functions
  - Added category support to `logPayment()`
  - Updated `getPayments()` to include category names

- Updated `types/index.ts`:
  - Replaced `MoneyGoal` with `Category`
  - Removed `GoalAllocation`
  - Added `category_id` and `category_name` to Payment types

- Created SQL migration: `supabase/CATEGORIES_MIGRATION.sql`

### 2. ⏳ What Still Needs to Be Done

#### A. Run SQL Migration
1. Open Supabase Dashboard → SQL Editor
2. Run `supabase/CATEGORIES_MIGRATION.sql`
3. This creates the `categories` table and adds RLS policies

#### B. Update Payments Page (`app/payments/page.tsx`)
Need to:
1. Add tabs: "General" and "Player Transactions"
2. Replace Money Goals section with Categories
3. Show categories with their balances
4. Allow adding/removing money from categories
5. Update PaymentForm to support categories

Structure:
```
Payments Page
├── Tab: General
│   ├── Budget Summary
│   ├── Categories (with add/remove money)
│   └── Transaction History
└── Tab: Player Transactions
    └── Table showing players and their balances
```

#### C. Create New Components

**`components/payments/CategoryCard.tsx`**
- Display category name and amount
- Buttons to add/remove money
- Delete category button

**`components/payments/CategoryForm.tsx`**
- Modal to create new category
- Input: category name
- Initial amount (optional)

**`components/payments/PlayerTransactionsTable.tsx`**
- Table showing all players
- Columns: Name, Position, Balance
- Quick add/remove money buttons

#### D. Update Dashboard (`app/page.tsx`)
1. Fetch and display categories
2. Show category amounts
3. Add quick action buttons to add money to categories

Example layout:
```
Dashboard
├── Stats Cards (Players, Fund Balance, Games Played)
├── Rank Card
└── Categories Section (NEW)
    └── Grid of category cards with quick add buttons
```

#### E. Update PaymentForm Component
Add category selection:
- Dropdown to select category (optional)
- When category is selected, money goes to that category
- Keep "General fund" option (no category)

#### F. Delete Old Files
These files are no longer needed:
- `lib/allocations.ts`
- `lib/allocations.test.ts`
- `components/payments/PaymentGoal.tsx`
- `components/payments/GoalForm.tsx`

## Database Schema

### New Table: categories
```sql
CREATE TABLE categories (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL
);
```

### Updated Table: payments
```sql
ALTER TABLE payments 
ADD COLUMN category_id uuid REFERENCES categories(id);
```

## Key Differences from Goals System

### Old System (Goals/Allocations)
- Goals had target amounts
- Money was "allocated" to goals
- Complex allocation tracking
- Goals could be "completed"
- Unallocated balance calculation

### New System (Categories)
- Categories are simple buckets
- Money is directly added/removed
- No target amounts
- No allocation tracking
- Simpler balance: Total - Sum(Categories)

## Example Usage

### Creating a Category
```typescript
await createCategory({ name: "Equipment Fund", amount: 0 });
```

### Adding Money to Category
```typescript
await logPayment({
  type: "add_money",
  amount: 100,
  category_id: "category-uuid",
  description: "Monthly dues"
});
// This automatically updates the category amount
```

### Viewing Categories on Dashboard
```typescript
const categories = await getCategories();
// Display each category with its current amount
// Add quick buttons to add money
```

## Migration Path for Existing Users

If users have existing goals:
1. Goals can be manually converted to categories
2. Or keep both systems (not recommended)
3. Or provide a migration tool to convert goals → categories

## Testing Checklist

- [ ] Run SQL migration successfully
- [ ] Create a category
- [ ] Add money to category
- [ ] Remove money from category
- [ ] Delete category
- [ ] View categories on dashboard
- [ ] Add money to category from dashboard
- [ ] View player transactions tab
- [ ] Filter payments by category
- [ ] Verify RLS works (different users see different categories)

## Next Steps

1. Run the SQL migration
2. Update the Payments page UI
3. Create the new components
4. Update the Dashboard
5. Test thoroughly
6. Delete old files
7. Update documentation
