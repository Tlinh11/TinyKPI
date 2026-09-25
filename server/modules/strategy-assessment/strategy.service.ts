import { strategyRepository, StrategyRepository } from './strategy.repository.js';
import { prisma } from '../../utils/prisma.js';

export class StrategyService {
  constructor(private repo: StrategyRepository = strategyRepository) {}

  async getAssessment(organization = 'Công ty', stage = 'Giai đoạn 1') {
    const record = await this.repo.findByOrgAndStage(organization, stage);
    if (!record) {
      return {
        organization,
        stage,
        vision: '',
        companyStrengths: [],
        competitorStrengths: [],
        industrySuccessFactors: [],
        competitors: [],
        competitiveAdvantage: [],
      };
    }

    return {
      id: record.id,
      organization: record.organization,
      stage: record.stage,
      vision: record.vision || '',
      companyStrengths: record.companyStrengths ? JSON.parse(record.companyStrengths) : [],
      competitorStrengths: record.competitorStrengths ? JSON.parse(record.competitorStrengths) : [],
      industrySuccessFactors: record.industrySuccessFactors ? JSON.parse(record.industrySuccessFactors) : [],
      competitors: record.competitors ? JSON.parse(record.competitors) : [],
      competitiveAdvantage: record.competitiveAdvantage ? JSON.parse(record.competitiveAdvantage) : [],
    };
  }

  async saveAssessment(data: any, userId?: string, userEmail?: string) {
    const { organization = 'Công ty', stage = 'Giai đoạn 1', vision, companyStrengths, competitorStrengths, industrySuccessFactors, competitors, competitiveAdvantage } = data;

    const payload = {
      organization,
      stage,
      vision: vision || '',
      companyStrengths: Array.isArray(companyStrengths) ? JSON.stringify(companyStrengths) : (companyStrengths || '[]'),
      competitorStrengths: Array.isArray(competitorStrengths) ? JSON.stringify(competitorStrengths) : (competitorStrengths || '[]'),
      industrySuccessFactors: Array.isArray(industrySuccessFactors) ? JSON.stringify(industrySuccessFactors) : (industrySuccessFactors || '[]'),
      competitors: Array.isArray(competitors) ? JSON.stringify(competitors) : (competitors || '[]'),
      competitiveAdvantage: Array.isArray(competitiveAdvantage) ? JSON.stringify(competitiveAdvantage) : (competitiveAdvantage || '[]'),
    };

    const saved = await this.repo.upsert(payload);

    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'UPDATE',
        entity: 'StrategyAssessment',
        entityId: saved.id,
        newValue: `Cập nhật Canvas Chiến lược ${organization} - ${stage}`,
      },
    });

    return this.getAssessment(organization, stage);
  }
}

export const strategyService = new StrategyService();
