from django.db import models
from core.models import Product, Branch

class Ingredient(models.Model):
    name = models.CharField(max_length=100)
    unit = models.CharField(max_length=20) # e.g., kg, gram, unit
    sku = models.CharField(max_length=50, unique=True, null=True, blank=True)

    def __str__(self):
        return self.name

class BranchInventory(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='inventory')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    low_stock_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=3)

    class Meta:
        unique_together = ('branch', 'ingredient')

    def __str__(self):
        return f"{self.branch.name} - {self.ingredient.name} ({self.quantity} {self.ingredient.unit})"

class BranchProductStock(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='product_stock')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('branch', 'product')

    def __str__(self):
        return f"{self.branch.name} - {self.product.name} ({self.quantity} units)"

class Recipe(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='recipes')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2) # Amount needed for 1 unit of product

    def __str__(self):
        return f"{self.product.name} Recipe Item: {self.ingredient.name}"

class InventoryLog(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True)
    change = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        item_name = self.product.name if self.product else (self.ingredient.name if self.ingredient else "Unknown")
        return f"{self.branch.name} - {item_name} - {self.change}"
