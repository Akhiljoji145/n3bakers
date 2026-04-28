from rest_framework import serializers
from .models import Branch, Category, Product

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    stock_quantity = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = '__all__'

    def get_stock_quantity(self, obj):
        branch_id = self.context.get('branch_id')
        if not branch_id:
            return None
            
        from inventory.models import BranchProductStock
        stock = BranchProductStock.objects.filter(branch_id=branch_id, product=obj).first()
        return stock.quantity if stock else 0
