from django.urls import path
from .views import ProductionPlanView

urlpatterns = [
    path('production-plan/', ProductionPlanView.as_view(), name='production_plan'),
]
