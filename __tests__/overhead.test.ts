import { calculateHourlyRate } from '../src/services/overhead';
import { HourlyRateInputs } from '../src/types';

describe('Overhead Calculations', () => {
  describe('calculateHourlyRate', () => {
    it('should calculate overhead per hour', () => {
      const overhead = 60000; // $60k annual overhead
      const inputs: HourlyRateInputs = {
        employees: 1,
        billableHoursPerEmployeePerYear: 1200,
        desiredProfitPercent: 15,
        includeDirectLaborCost: false,
        laborCostPerHour: 0,
      };

      const results = calculateHourlyRate(overhead, inputs);

      expect(results.overheadPerHour).toBe(50); // 60000 / 1200
    });

    it('should calculate base rate without labor cost', () => {
      const overhead = 60000;
      const inputs: HourlyRateInputs = {
        employees: 1,
        billableHoursPerEmployeePerYear: 1200,
        desiredProfitPercent: 15,
        includeDirectLaborCost: false,
        laborCostPerHour: 0,
      };

      const results = calculateHourlyRate(overhead, inputs);

      expect(results.baseRate).toBe(50); // Same as overhead per hour
    });

    it('should calculate base rate with labor cost', () => {
      const overhead = 60000;
      const inputs: HourlyRateInputs = {
        employees: 1,
        billableHoursPerEmployeePerYear: 1200,
        desiredProfitPercent: 15,
        includeDirectLaborCost: true,
        laborCostPerHour: 25,
      };

      const results = calculateHourlyRate(overhead, inputs);

      expect(results.baseRate).toBe(75); // 50 + 25
    });

    it('should calculate target rate with profit margin', () => {
      const overhead = 60000;
      const inputs: HourlyRateInputs = {
        employees: 1,
        billableHoursPerEmployeePerYear: 1200,
        desiredProfitPercent: 15,
        includeDirectLaborCost: false,
        laborCostPerHour: 0,
      };

      const results = calculateHourlyRate(overhead, inputs);

      // baseRate / (1 - 0.15) = 50 / 0.85 = 58.82
      expect(results.targetRate).toBeCloseTo(58.82, 2);
    });

    it('should calculate quick reference rates', () => {
      const overhead = 60000;
      const inputs: HourlyRateInputs = {
        employees: 1,
        billableHoursPerEmployeePerYear: 1200,
        desiredProfitPercent: 15,
        includeDirectLaborCost: false,
        laborCostPerHour: 0,
      };

      const results = calculateHourlyRate(overhead, inputs);

      // 50 / (1 - 0.10) = 55.56
      expect(results.targetRateWith10Percent).toBeCloseTo(55.56, 2);

      // 50 / (1 - 0.15) = 58.82
      expect(results.targetRateWith15Percent).toBeCloseTo(58.82, 2);

      // 50 / (1 - 0.20) = 62.50
      expect(results.targetRateWith20Percent).toBeCloseTo(62.50, 2);
    });

    it('should handle multiple employees', () => {
      const overhead = 120000;
      const inputs: HourlyRateInputs = {
        employees: 2,
        billableHoursPerEmployeePerYear: 1200,
        desiredProfitPercent: 15,
        includeDirectLaborCost: false,
        laborCostPerHour: 0,
      };

      const results = calculateHourlyRate(overhead, inputs);

      // 120000 / (2 * 1200) = 120000 / 2400 = 50
      expect(results.overheadPerHour).toBe(50);
    });

    it('should handle zero overhead gracefully', () => {
      const overhead = 0;
      const inputs: HourlyRateInputs = {
        employees: 1,
        billableHoursPerEmployeePerYear: 1200,
        desiredProfitPercent: 15,
        includeDirectLaborCost: false,
        laborCostPerHour: 0,
      };

      const results = calculateHourlyRate(overhead, inputs);

      expect(results.overheadPerHour).toBe(0);
      expect(results.baseRate).toBe(0);
      expect(results.targetRate).toBe(0);
    });
  });
});
