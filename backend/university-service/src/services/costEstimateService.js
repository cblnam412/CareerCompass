import mongoose from 'mongoose';
import UniversityMajorRepository from '../repositories/UniversityMajorRepository.js';
import { HttpError } from '../utils/httpError.js';

const BASE_MONTHLY_COSTS = {
  rent: 2500000,
  living: 1200000,
};

const housingMultipliers = {
  privateRental: 1,
  dormitory: 0.52,
  familyHome: 0,
};

const livingMultipliers = {
  budget: 0.82,
  standard: 1,
  comfortable: 1.28,
};

const roundToNearest = (value, step = 50000) => Math.round(value / step) * step;

const normalizeDurationYears = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 4;
};

const buildCategory = (id, monthlyAmount, totalMonthly, durationYears) => ({
  id,
  monthlyAmount,
  percentage: totalMonthly > 0 ? (monthlyAmount / totalMonthly) * 100 : 0,
  programAmount: monthlyAmount * 12 * durationYears,
});

class CostEstimateService {
  async estimate(payload = {}) {
    const { universityMajorId, housingType = 'privateRental', livingLevel = 'standard' } = payload;

    if (!mongoose.Types.ObjectId.isValid(universityMajorId)) {
      throw new HttpError(400, 'universityMajorId khong hop le');
    }

    if (!Object.prototype.hasOwnProperty.call(housingMultipliers, housingType)) {
      throw new HttpError(400, 'housingType khong hop le');
    }

    if (!Object.prototype.hasOwnProperty.call(livingMultipliers, livingLevel)) {
      throw new HttpError(400, 'livingLevel khong hop le');
    }

    const universityMajor = await UniversityMajorRepository.findByIdPopulated(universityMajorId);
    if (!universityMajor) throw new HttpError(404, 'Khong tim thay nganh cua truong');

    const durationYears = normalizeDurationYears(universityMajor.duration);
    const annualTuition = Number(universityMajor.tuitionFee || 0);

    const monthlyCosts = {
      tuition: roundToNearest(annualTuition > 0 ? annualTuition / 12 : 0),
      housing: roundToNearest(BASE_MONTHLY_COSTS.rent * housingMultipliers[housingType]),
      living: roundToNearest(BASE_MONTHLY_COSTS.living * livingMultipliers[livingLevel]),
    };

    const totalMonthly = Object.values(monthlyCosts).reduce((sum, amount) => sum + amount, 0);
    const totalAnnual = totalMonthly * 12;
    const totalProgramCost = totalAnnual * durationYears;

    return {
      totalMonthly,
      totalAnnual,
      durationYears,
      totalProgramCost,
      categories: [
        buildCategory('tuition', monthlyCosts.tuition, totalMonthly, durationYears),
        buildCategory('housing', monthlyCosts.housing, totalMonthly, durationYears),
        buildCategory('living', monthlyCosts.living, totalMonthly, durationYears),
      ],
    };
  }
}

export default new CostEstimateService();
