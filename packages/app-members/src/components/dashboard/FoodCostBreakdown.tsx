import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Inputs, LineItem } from "@satyrsmc/shared/client";
import { isFoodCategory, EVENT_DAYS } from "@/lib/event-constants";

interface FoodCostBreakdownProps {
  lineItems: LineItem[];
  inputs: Inputs;
}

export function FoodCostBreakdown({ lineItems, inputs }: FoodCostBreakdownProps) {
  const totalFoodCost = lineItems
    .filter((li) => isFoodCategory(li.category))
    .reduce((sum, li) => sum + li.unitCost * li.quantity, 0);

  const maxOccupancy = inputs.maxOccupancy;
  const staffCount = inputs.staffCount;
  const dayPassesSold = inputs.dayPassesSold ?? 0;

  const attendeeMeals = maxOccupancy * EVENT_DAYS;
  const staffMeals = staffCount * EVENT_DAYS;
  const dayPassMeals = dayPassesSold * 1;
  const totalMeals = attendeeMeals + staffMeals + dayPassMeals;

  const costPerMeal = totalMeals > 0 ? totalFoodCost / totalMeals : 0;
  const foodCostPerAttendee = costPerMeal * EVENT_DAYS;
  const foodCostPerDayPass = costPerMeal;
  const foodCostPerDay = totalFoodCost / EVENT_DAYS;
  const foodCostPerStaff = costPerMeal * EVENT_DAYS;

  if (totalFoodCost === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Food cost breakdown</CardTitle>
          <CardDescription>No food or beverage line items in this budget.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Food cost breakdown</CardTitle>
        <CardDescription>
          Total food & beverage: ${totalFoodCost.toLocaleString()}. Assumes 4-day event; attendees
          and staff get 4 days of meals; day pass = 1 meal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="text-muted-foreground text-xs">Per attendee (4 days)</p>
            <p className="text-lg font-semibold">${foodCostPerAttendee.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Per day pass (1 meal)</p>
            <p className="text-lg font-semibold">${foodCostPerDayPass.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Cost per day</p>
            <p className="text-lg font-semibold">${foodCostPerDay.toFixed(2)}</p>
            <p className="text-muted-foreground text-xs">Total ÷ 4 days</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Per staff (4 days)</p>
            <p className="text-lg font-semibold">${foodCostPerStaff.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Cost per meal</p>
            <p className="text-lg font-semibold">${costPerMeal.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
