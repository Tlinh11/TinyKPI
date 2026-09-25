import { prisma } from '../../utils/prisma.js';

export class StrategyRepository {
  async findByOrgAndStage(organization: string, stage: string) {
    return prisma.strategyAssessment.findUnique({
      where: {
        organization_stage: {
          organization,
          stage,
        },
      },
    });
  }

  async upsert(data: {
    organization: string;
    stage: string;
    vision?: string;
    companyStrengths?: string;
    competitorStrengths?: string;
    industrySuccessFactors?: string;
    competitors?: string;
    competitiveAdvantage?: string;
  }) {
    return prisma.strategyAssessment.upsert({
      where: {
        organization_stage: {
          organization: data.organization,
          stage: data.stage,
        },
      },
      update: data,
      create: data,
    });
  }
}

export const strategyRepository = new StrategyRepository();
