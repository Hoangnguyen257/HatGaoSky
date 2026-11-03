import React, { createContext, useContext, useState } from 'react';

export interface Passenger {
  firstName: string;
  lastName: string;
  passengerType: 'ADULT' | 'CHILD' | 'INFANT';
  dateOfBirth: string;
  passportNumber: string;
  nationality: string;
}

interface BookingContextType {
  outboundFlight: any | null;
  cabinClass: string;
  passengers: Passenger[];
  selectedSeats: string[];
  selectedSeatDetails: { seatNumber: string; cabinClass: string }[];
  baggageWeight: number;
  hasMeal: boolean;
  hasInsurance: boolean;
  hasPriority: boolean;
  baseFareTotal: number;
  taxesAndFees: number;
  servicesTotal: number;
  grandTotal: number;
  sessionId: string;
  setOutboundFlight: (flight: any, initialCabin?: string) => void;
  setCabinClass: (cabin: string) => void;
  setPassengers: (passengers: Passenger[]) => void;
  setSeats: (seats: string[], details?: { seatNumber: string; cabinClass: string }[]) => void;
  setBaggageWeight: (w: number) => void;
  setHasMeal: (val: boolean) => void;
  setHasInsurance: (val: boolean) => void;
  setHasPriority: (val: boolean) => void;
  resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType>({} as any);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionId] = useState(() => `mob-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [outboundFlight, setOutboundFlightState] = useState<any | null>(null);
  const [cabinClass, setCabinClass] = useState<string>('ECONOMY');
  const [passengers, setPassengers] = useState<Passenger[]>([
    {
      firstName: '',
      lastName: '',
      passengerType: 'ADULT',
      dateOfBirth: '1995-05-15',
      passportNumber: '',
      nationality: 'VNM',
    },
  ]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [selectedSeatDetails, setSelectedSeatDetails] = useState<{ seatNumber: string; cabinClass: string }[]>([]);
  const [baggageWeight, setBaggageWeight] = useState<number>(0);
  const [hasMeal, setHasMeal] = useState<boolean>(false);
  const [hasInsurance, setHasInsurance] = useState<boolean>(false);
  const [hasPriority, setHasPriority] = useState<boolean>(false);

  const setOutboundFlight = (flight: any, initialCabin: string = 'ECONOMY') => {
    setOutboundFlightState(flight);
    setCabinClass(initialCabin);
    setSelectedSeats([]);
    setSelectedSeatDetails([]);
  };

  const setSeats = (seats: string[], details?: { seatNumber: string; cabinClass: string }[]) => {
    setSelectedSeats(seats);
    if (details && details.length > 0) {
      setSelectedSeatDetails(details);
      // Automatically switch cabin class if user chose a business seat or economy seat
      const hasBusiness = details.some((d) => d.cabinClass === 'BUSINESS');
      setCabinClass(hasBusiness ? 'BUSINESS' : 'ECONOMY');
    } else {
      setSelectedSeatDetails([]);
    }
  };

  // Pricing calculations
  const effectiveCabin = cabinClass;
  const fare = outboundFlight?.fares?.find((f: any) => f.cabinClass === effectiveCabin) || outboundFlight?.fares?.[0];
  const defaultPrice = effectiveCabin === 'BUSINESS' ? 4200000 : 1450000;
  const basePricePerPax = fare?.basePrice || defaultPrice;

  const baseFareTotal = passengers.reduce((sum, p) => {
    let paxPrice = basePricePerPax;
    if (p.passengerType === 'INFANT') return sum + paxPrice * 0.1;
    if (p.passengerType === 'CHILD') return sum + paxPrice * 0.75;
    return sum + paxPrice;
  }, 0);

  const taxesAndFees = Math.round(baseFareTotal * 0.1 + passengers.length * 120000);

  let baggageFee = 0;
  if (baggageWeight === 10) baggageFee = 180000;
  else if (baggageWeight === 20) baggageFee = 320000;
  else if (baggageWeight === 30) baggageFee = 450000;

  const mealFee = hasMeal ? 150000 * passengers.length : 0;
  const insuranceFee = hasInsurance ? 120000 * passengers.length : 0;
  const priorityFee = hasPriority ? 100000 * passengers.length : 0;
  const servicesTotal = baggageFee + mealFee + insuranceFee + priorityFee;

  const grandTotal = baseFareTotal + taxesAndFees + servicesTotal;

  const resetBooking = () => {
    setOutboundFlightState(null);
    setCabinClass('ECONOMY');
    setSelectedSeats([]);
    setSelectedSeatDetails([]);
    setBaggageWeight(0);
    setHasMeal(false);
    setHasInsurance(false);
    setHasPriority(false);
  };

  return (
    <BookingContext.Provider
      value={{
        outboundFlight,
        cabinClass,
        passengers,
        selectedSeats,
        selectedSeatDetails,
        baggageWeight,
        hasMeal,
        hasInsurance,
        hasPriority,
        baseFareTotal,
        taxesAndFees,
        servicesTotal,
        grandTotal,
        sessionId,
        setOutboundFlight,
        setCabinClass,
        setPassengers,
        setSeats,
        setBaggageWeight,
        setHasMeal,
        setHasInsurance,
        setHasPriority,
        resetBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);
