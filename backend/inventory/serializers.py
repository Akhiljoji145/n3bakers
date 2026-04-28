from rest_framework import serializers
from .models import Ingredient, BranchInventory, BranchProductStock, Recipe, InventoryLog

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = '__all__'

class BranchInventorySerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)
    unit = serializers.CharField(source='ingredient.unit', read_only=True)

    class Meta:
        model = BranchInventory
        fields = '__all__'
        extra_kwargs = {
            'branch': {'required': False}
        }
        validators = []

class BranchProductStockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = BranchProductStock
        fields = '__all__'
        extra_kwargs = {
            'branch': {'required': False}
        }
        validators = []

class RecipeSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)

    class Meta:
        model = Recipe
        fields = '__all__'
