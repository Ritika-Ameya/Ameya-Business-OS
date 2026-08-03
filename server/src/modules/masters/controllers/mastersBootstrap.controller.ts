import type { Request, Response } from 'express';

import { HTTP_STATUS, MESSAGES } from '../../../constants';
import { asyncHandler } from '../../../utils/asyncHandler.util';
import { ApiResponse } from '../../../utils/apiResponse.util';
import { getResponseMeta } from '../../../utils/responseMeta.util';
import {
  brandingService,
  companyMasterService,
  countryService,
  dealTypeService,
  expenseCategoryService,
  industryService,
  invoiceConfigurationService,
  opportunitySourceService,
  paymentMethodService,
  renewalFrequencyService,
  stageMasterService,
  stateService,
} from '../services/master.services';

/**
 * Single round-trip bootstrap for SPA settings shell.
 * Collapses ~12 masters GETs into one authenticated request.
 */
export const mastersBootstrap = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const [
    company,
    invoiceConfiguration,
    branding,
    stages,
    opportunitySources,
    industries,
    dealTypes,
    paymentMethods,
    expenseCategories,
    renewalFrequencies,
    countries,
    states,
  ] = await Promise.all([
    companyMasterService.getCurrent(),
    invoiceConfigurationService.getCurrent(),
    brandingService.getCurrent(),
    stageMasterService.getAll(),
    opportunitySourceService.getAll(),
    industryService.getAll(),
    dealTypeService.getAll(),
    paymentMethodService.getAll(),
    expenseCategoryService.getAll(),
    renewalFrequencyService.getAll(),
    countryService.getAll(),
    stateService.getAll(),
  ]);

  ApiResponse.success(
    res,
    {
      company,
      invoiceConfiguration,
      branding,
      stages,
      opportunitySources,
      industries,
      dealTypes,
      paymentMethods,
      expenseCategories,
      renewalFrequencies,
      countries,
      states,
    },
    MESSAGES.SUCCESS,
    HTTP_STATUS.OK,
    getResponseMeta(req),
  );
});
