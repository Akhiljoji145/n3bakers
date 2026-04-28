"""
Management command: seed_test_data
Creates test branches, categories, products, ingredients, branch inventory,
recipes, and users for all roles.
Run with: py manage.py seed_test_data
Re-run safely; existing records are updated or skipped.
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from core.models import Branch, Category, Product
from inventory.models import BranchInventory, Ingredient, Recipe
from users.models import UserRole

User = get_user_model()


BRANCHES = [
    {"name": "Main Bakery", "location": "123 Baker Street, Downtown", "is_active": True},
    {"name": "Mall Outlet", "location": "City Mall, Level 2, East Wing", "is_active": True},
    {"name": "Airport Kiosk", "location": "Terminal 1, Departures Gate 4", "is_active": False},
]

CATEGORIES = [
    {"name": "Breads", "description": "Fresh baked breads, loaves and rolls"},
    {"name": "Cakes", "description": "Celebration and everyday cakes"},
    {"name": "Pastries", "description": "Croissants, danishes and puff pastries"},
    {"name": "Cookies", "description": "Cookies, biscuits and shortbreads"},
    {"name": "Beverages", "description": "Coffee, tea and cold drinks"},
]

PRODUCTS = [
    {"name": "Sourdough Loaf", "price": "180.00", "category": "Breads", "description": "Classic tangy sourdough, slow fermented overnight"},
    {"name": "Whole Wheat Bread", "price": "120.00", "category": "Breads", "description": "Nutritious whole wheat sandwich bread"},
    {"name": "Garlic Baguette", "price": "80.00", "category": "Breads", "description": "Crispy French baguette with garlic butter"},
    {"name": "Chocolate Truffle", "price": "450.00", "category": "Cakes", "description": "Rich dark chocolate mousse cake"},
    {"name": "Red Velvet", "price": "380.00", "category": "Cakes", "description": "Classic red velvet with cream cheese frosting"},
    {"name": "Black Forest", "price": "420.00", "category": "Cakes", "description": "Layers of chocolate sponge, cherries and cream"},
    {"name": "Butter Croissant", "price": "60.00", "category": "Pastries", "description": "Flaky, buttery all-butter croissant"},
    {"name": "Pain au Chocolat", "price": "75.00", "category": "Pastries", "description": "Croissant dough wrapped around dark chocolate"},
    {"name": "Almond Danish", "price": "90.00", "category": "Pastries", "description": "Danish pastry filled with almond cream"},
    {"name": "Choco Chip Cookies", "price": "40.00", "category": "Cookies", "description": "Soft baked cookies with chocolate chips (pack of 6)"},
    {"name": "Shortbread Fingers", "price": "50.00", "category": "Cookies", "description": "Classic buttery Scottish shortbread"},
    {"name": "Filter Coffee", "price": "55.00", "category": "Beverages", "description": "South Indian style filter coffee"},
    {"name": "Masala Chai", "price": "45.00", "category": "Beverages", "description": "Spiced milk tea with ginger and cardamom"},
]

INGREDIENTS = [
    {"name": "Flour", "unit": "kg", "sku": "ING-FLOUR"},
    {"name": "Butter", "unit": "kg", "sku": "ING-BUTTER"},
    {"name": "Sugar", "unit": "kg", "sku": "ING-SUGAR"},
    {"name": "Yeast", "unit": "kg", "sku": "ING-YEAST"},
    {"name": "Chocolate", "unit": "kg", "sku": "ING-CHOC"},
    {"name": "Cream", "unit": "kg", "sku": "ING-CREAM"},
    {"name": "Coffee Beans", "unit": "kg", "sku": "ING-COFFEE"},
    {"name": "Tea Leaves", "unit": "kg", "sku": "ING-TEA"},
]

BRANCH_INVENTORY = {
    "Main Bakery": {
        "Flour": {"quantity": "120.00", "low_stock_threshold": "20.00"},
        "Butter": {"quantity": "42.00", "low_stock_threshold": "10.00"},
        "Sugar": {"quantity": "55.00", "low_stock_threshold": "12.00"},
        "Yeast": {"quantity": "12.00", "low_stock_threshold": "3.00"},
        "Chocolate": {"quantity": "28.00", "low_stock_threshold": "6.00"},
        "Cream": {"quantity": "24.00", "low_stock_threshold": "5.00"},
        "Coffee Beans": {"quantity": "10.00", "low_stock_threshold": "2.50"},
        "Tea Leaves": {"quantity": "9.00", "low_stock_threshold": "2.00"},
    },
    "Mall Outlet": {
        "Flour": {"quantity": "70.00", "low_stock_threshold": "15.00"},
        "Butter": {"quantity": "18.00", "low_stock_threshold": "6.00"},
        "Sugar": {"quantity": "26.00", "low_stock_threshold": "8.00"},
        "Yeast": {"quantity": "5.00", "low_stock_threshold": "2.00"},
        "Chocolate": {"quantity": "12.00", "low_stock_threshold": "4.00"},
        "Cream": {"quantity": "8.00", "low_stock_threshold": "3.00"},
        "Coffee Beans": {"quantity": "4.50", "low_stock_threshold": "1.50"},
        "Tea Leaves": {"quantity": "3.50", "low_stock_threshold": "1.20"},
    },
}

RECIPES = [
    {"product": "Sourdough Loaf", "ingredient": "Flour", "quantity": "0.45"},
    {"product": "Sourdough Loaf", "ingredient": "Yeast", "quantity": "0.01"},
    {"product": "Whole Wheat Bread", "ingredient": "Flour", "quantity": "0.40"},
    {"product": "Whole Wheat Bread", "ingredient": "Yeast", "quantity": "0.01"},
    {"product": "Garlic Baguette", "ingredient": "Flour", "quantity": "0.25"},
    {"product": "Garlic Baguette", "ingredient": "Butter", "quantity": "0.03"},
    {"product": "Chocolate Truffle", "ingredient": "Chocolate", "quantity": "0.20"},
    {"product": "Chocolate Truffle", "ingredient": "Cream", "quantity": "0.12"},
    {"product": "Chocolate Truffle", "ingredient": "Sugar", "quantity": "0.08"},
    {"product": "Red Velvet", "ingredient": "Flour", "quantity": "0.18"},
    {"product": "Red Velvet", "ingredient": "Cream", "quantity": "0.10"},
    {"product": "Red Velvet", "ingredient": "Sugar", "quantity": "0.07"},
    {"product": "Black Forest", "ingredient": "Chocolate", "quantity": "0.15"},
    {"product": "Black Forest", "ingredient": "Cream", "quantity": "0.14"},
    {"product": "Black Forest", "ingredient": "Sugar", "quantity": "0.08"},
    {"product": "Butter Croissant", "ingredient": "Flour", "quantity": "0.09"},
    {"product": "Butter Croissant", "ingredient": "Butter", "quantity": "0.04"},
    {"product": "Pain au Chocolat", "ingredient": "Flour", "quantity": "0.09"},
    {"product": "Pain au Chocolat", "ingredient": "Butter", "quantity": "0.04"},
    {"product": "Pain au Chocolat", "ingredient": "Chocolate", "quantity": "0.03"},
    {"product": "Almond Danish", "ingredient": "Flour", "quantity": "0.10"},
    {"product": "Almond Danish", "ingredient": "Butter", "quantity": "0.04"},
    {"product": "Choco Chip Cookies", "ingredient": "Flour", "quantity": "0.08"},
    {"product": "Choco Chip Cookies", "ingredient": "Sugar", "quantity": "0.05"},
    {"product": "Choco Chip Cookies", "ingredient": "Chocolate", "quantity": "0.04"},
    {"product": "Shortbread Fingers", "ingredient": "Flour", "quantity": "0.07"},
    {"product": "Shortbread Fingers", "ingredient": "Butter", "quantity": "0.05"},
    {"product": "Shortbread Fingers", "ingredient": "Sugar", "quantity": "0.03"},
    {"product": "Filter Coffee", "ingredient": "Coffee Beans", "quantity": "0.02"},
    {"product": "Masala Chai", "ingredient": "Tea Leaves", "quantity": "0.02"},
]

STAFF_USERS = [
    {"username": "admin", "password": "admin123", "role": UserRole.ADMIN, "branch": None},
    {"username": "manager_main", "password": "manager123", "role": UserRole.MANAGER, "branch": 0},
    {"username": "manager_mall", "password": "manager123", "role": UserRole.MANAGER, "branch": 1},
    {"username": "baker_main", "password": "baker123", "role": UserRole.BAKER, "branch": 0},
    {"username": "baker_mall", "password": "baker123", "role": UserRole.BAKER, "branch": 1},
    {"username": "customer1", "password": "customer123", "role": UserRole.CUSTOMER, "branch": None},
    {"username": "customer2", "password": "customer123", "role": UserRole.CUSTOMER, "branch": None},
]


class Command(BaseCommand):
    help = "Seed test data for branches, catalog, inventory, recipes, and users."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all existing seed data before re-creating it.",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            self.stdout.write(self.style.WARNING("Resetting seed data..."))
            User.objects.filter(username__in=[u["username"] for u in STAFF_USERS]).delete()
            Recipe.objects.all().delete()
            BranchInventory.objects.all().delete()
            Ingredient.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            Branch.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("  Cleared.\n"))

        self.stdout.write(">>> Creating branches...")
        branch_objs = []
        branch_map = {}
        for data in BRANCHES:
            obj, created = Branch.objects.get_or_create(
                name=data["name"],
                defaults={"location": data["location"], "is_active": data["is_active"]},
            )
            branch_objs.append(obj)
            branch_map[obj.name] = obj
            status = "[+]" if created else "[-]"
            self.stdout.write(f"   {status} {obj.name}")

        self.stdout.write("\n>>> Creating categories...")
        cat_map = {}
        for data in CATEGORIES:
            obj, created = Category.objects.get_or_create(
                name=data["name"],
                defaults={"description": data["description"]},
            )
            cat_map[data["name"]] = obj
            status = "[+]" if created else "[-]"
            self.stdout.write(f"   {status} {obj.name}")

        self.stdout.write("\n>>> Creating products...")
        product_map = {}
        for data in PRODUCTS:
            category = cat_map.get(data["category"])
            if not category:
                self.stdout.write(self.style.WARNING(f"   [!] Category not found: {data['category']}"))
                continue
            obj, created = Product.objects.get_or_create(
                name=data["name"],
                defaults={
                    "price": data["price"],
                    "category": category,
                    "description": data["description"],
                    "is_available": True,
                },
            )
            product_map[data["name"]] = obj
            status = "[+]" if created else "[-]"
            self.stdout.write(f"   {status} {obj.name}  Rs.{obj.price}  [{data['category']}]")

        self.stdout.write("\n>>> Creating ingredients...")
        ingredient_map = {}
        for data in INGREDIENTS:
            obj, created = Ingredient.objects.get_or_create(
                sku=data["sku"],
                defaults={"name": data["name"], "unit": data["unit"]},
            )
            if not created:
                updated = False
                if obj.name != data["name"]:
                    obj.name = data["name"]
                    updated = True
                if obj.unit != data["unit"]:
                    obj.unit = data["unit"]
                    updated = True
                if updated:
                    obj.save(update_fields=["name", "unit"])
            ingredient_map[data["name"]] = obj
            status = "[+]" if created else "[-]"
            self.stdout.write(f"   {status} {obj.name} ({obj.unit})")

        self.stdout.write("\n>>> Creating branch inventory...")
        for branch_name, inventory_data in BRANCH_INVENTORY.items():
            branch = branch_map.get(branch_name)
            if not branch:
                self.stdout.write(self.style.WARNING(f"   [!] Branch not found: {branch_name}"))
                continue
            self.stdout.write(f"   {branch_name}")
            for ingredient_name, stock in inventory_data.items():
                ingredient = ingredient_map.get(ingredient_name)
                if not ingredient:
                    self.stdout.write(self.style.WARNING(f"      [!] Ingredient not found: {ingredient_name}"))
                    continue
                obj, created = BranchInventory.objects.get_or_create(
                    branch=branch,
                    ingredient=ingredient,
                    defaults={
                        "quantity": stock["quantity"],
                        "low_stock_threshold": stock["low_stock_threshold"],
                    },
                )
                if not created:
                    obj.quantity = stock["quantity"]
                    obj.low_stock_threshold = stock["low_stock_threshold"]
                    obj.save(update_fields=["quantity", "low_stock_threshold"])
                status = "[+]" if created else "[-]"
                self.stdout.write(
                    f"      {status} {ingredient.name:<16} qty={obj.quantity} {ingredient.unit} "
                    f"threshold={obj.low_stock_threshold}"
                )

        self.stdout.write("\n>>> Creating recipes...")
        for data in RECIPES:
            product = product_map.get(data["product"])
            ingredient = ingredient_map.get(data["ingredient"])
            if not product or not ingredient:
                self.stdout.write(
                    self.style.WARNING(
                        f"   [!] Recipe skipped: product={data['product']} ingredient={data['ingredient']}"
                    )
                )
                continue
            obj, created = Recipe.objects.get_or_create(
                product=product,
                ingredient=ingredient,
                defaults={"quantity": data["quantity"]},
            )
            if not created and str(obj.quantity) != data["quantity"]:
                obj.quantity = data["quantity"]
                obj.save(update_fields=["quantity"])
            status = "[+]" if created else "[-]"
            self.stdout.write(f"   {status} {product.name} -> {ingredient.name} ({obj.quantity} {ingredient.unit})")

        self.stdout.write("\n>>> Creating users...")
        for data in STAFF_USERS:
            if User.objects.filter(username=data["username"]).exists():
                self.stdout.write(f"   [-] exists : {data['username']} ({data['role']})")
                continue

            branch = branch_objs[data["branch"]] if data["branch"] is not None else None
            user = User.objects.create_user(
                username=data["username"],
                password=data["password"],
                role=data["role"],
                branch=branch,
            )
            if data["role"] == UserRole.ADMIN:
                user.is_staff = True
                user.save(update_fields=["is_staff"])

            self.stdout.write(
                f"   [+] {user.username:<20} role={user.role:<10} "
                f"branch={branch.name if branch else 'HQ'}"
            )

        self.stdout.write("\n" + "=" * 52)
        self.stdout.write(self.style.SUCCESS("SEED COMPLETE!\n"))
        self.stdout.write("  LOGIN CREDENTIALS")
        self.stdout.write("  " + "-" * 48)
        self.stdout.write(f"  {'USERNAME':<20} {'PASSWORD':<14} {'ROLE'}")
        self.stdout.write("  " + "-" * 48)
        for data in STAFF_USERS:
            self.stdout.write(f"  {data['username']:<20} {data['password']:<14} {data['role']}")
        self.stdout.write("  " + "-" * 48)
        self.stdout.write(f"\n  Branches   : {Branch.objects.count()}")
        self.stdout.write(f"  Categories : {Category.objects.count()}")
        self.stdout.write(f"  Products   : {Product.objects.count()}")
        self.stdout.write(f"  Ingredients: {Ingredient.objects.count()}")
        self.stdout.write(f"  Branch Inv.: {BranchInventory.objects.count()}")
        self.stdout.write(f"  Recipes    : {Recipe.objects.count()}")
        self.stdout.write(f"  Users      : {User.objects.count()}\n")
