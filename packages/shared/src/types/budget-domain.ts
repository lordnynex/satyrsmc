export interface Inputs {
  profitTarget: number;
  staffCount: number;
  maxOccupancy: number;
  complimentaryTickets: number;
  dayPassPrice: number;
  dayPassesSold: number;
  ticketPrices: {
    proposedPrice1: number;
    proposedPrice2: number;
    proposedPrice3: number;
    staffPrice1: number;
    staffPrice2: number;
    staffPrice3: number;
  };
}

export interface LineItem {
  id: string;
  name: string;
  category: string;
  comments?: string;
  unitCost: number;
  quantity: number;
  historicalCosts?: Record<string, number>;
}

export interface Budget {
  id: string;
  name: string;
  year: number;
  description: string | null;
  created_at?: string;
  lineItems: LineItem[];
}

export interface BudgetSummary {
  id: string;
  name: string;
  year: number;
  description: string | null;
  created_at: string;
}
