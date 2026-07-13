import { Router } from 'express';

import type { BaseEntity } from '../../../types';
import {
  brandingCreateSchema,
  brandingUpdateSchema,
  companyMasterCreateSchema,
  companyMasterUpdateSchema,
  countryCreateSchema,
  countryUpdateSchema,
  expenseCategoryCreateSchema,
  expenseCategoryUpdateSchema,
  industryCreateSchema,
  industryUpdateSchema,
  invoiceConfigurationCreateSchema,
  invoiceConfigurationUpdateSchema,
  notificationConfigurationCreateSchema,
  notificationConfigurationUpdateSchema,
  opportunitySourceCreateSchema,
  opportunitySourceUpdateSchema,
  renewalFrequencyCreateSchema,
  renewalFrequencyUpdateSchema,
  slugMasterCreateSchema,
  slugMasterUpdateSchema,
  stageMasterCreateSchema,
  stageMasterUpdateSchema,
  stateCreateSchema,
  stateUpdateSchema,
} from '../validators/master.validators';
import {
  MasterCrudController,
  MasterSingletonController,
} from '../shared/masterCrud.controller';
import {
  brandingService,
  companyMasterService,
  countryService,
  dealTypeService,
  expenseCategoryService,
  industryService,
  invoiceConfigurationService,
  notificationConfigurationService,
  opportunitySourceService,
  paymentMethodService,
  renewalFrequencyService,
  stageMasterService,
  stateService,
} from '../services/master.services';

const companyController = new MasterSingletonController(
  companyMasterService,
  companyMasterCreateSchema,
  companyMasterUpdateSchema,
);

const stageController = new MasterCrudController(
  stageMasterService,
  stageMasterCreateSchema,
  stageMasterUpdateSchema,
);

const opportunitySourceController = new MasterCrudController(
  opportunitySourceService,
  opportunitySourceCreateSchema,
  opportunitySourceUpdateSchema,
);

const industryController = new MasterCrudController(
  industryService,
  industryCreateSchema,
  industryUpdateSchema,
);

const dealTypeController = new MasterCrudController(
  dealTypeService,
  slugMasterCreateSchema,
  slugMasterUpdateSchema,
);

const paymentMethodController = new MasterCrudController(
  paymentMethodService,
  slugMasterCreateSchema,
  slugMasterUpdateSchema,
);

const expenseCategoryController = new MasterCrudController(
  expenseCategoryService,
  expenseCategoryCreateSchema,
  expenseCategoryUpdateSchema,
);

const renewalFrequencyController = new MasterCrudController(
  renewalFrequencyService,
  renewalFrequencyCreateSchema,
  renewalFrequencyUpdateSchema,
);

const countryController = new MasterCrudController(
  countryService,
  countryCreateSchema,
  countryUpdateSchema,
);

const stateController = new MasterCrudController(
  stateService,
  stateCreateSchema,
  stateUpdateSchema,
);

const invoiceConfigurationController = new MasterSingletonController(
  invoiceConfigurationService,
  invoiceConfigurationCreateSchema,
  invoiceConfigurationUpdateSchema,
);

const notificationConfigurationController = new MasterSingletonController(
  notificationConfigurationService,
  notificationConfigurationCreateSchema,
  notificationConfigurationUpdateSchema,
);

const brandingController = new MasterSingletonController(
  brandingService,
  brandingCreateSchema,
  brandingUpdateSchema,
);

const mountCrudRoutes = <TEntity extends BaseEntity & Record<string, unknown>>(
  router: Router,
  path: string,
  controller: MasterCrudController<TEntity>,
): void => {
  router.get(path, controller.list);
  router.post(path, ...controller.create);
  router.get(`${path}/:id`, controller.getById);
  router.put(`${path}/:id`, ...controller.update);
  router.delete(`${path}/:id`, controller.remove);
};

const mountSingletonRoutes = <TEntity extends BaseEntity & Record<string, unknown>>(
  router: Router,
  path: string,
  controller: MasterSingletonController<TEntity>,
): void => {
  router.get(path, controller.getCurrent);
  router.get(`${path}/all`, controller.list);
  router.put(path, ...controller.upsert);
  router.put(`${path}/:id`, ...controller.update);
  router.delete(`${path}/:id`, controller.remove);
};

export const mastersRouter = Router();

mountSingletonRoutes(mastersRouter, '/company', companyController);
mountCrudRoutes(mastersRouter, '/stages', stageController);
mountCrudRoutes(mastersRouter, '/opportunity-sources', opportunitySourceController);
mountCrudRoutes(mastersRouter, '/industries', industryController);
mountCrudRoutes(mastersRouter, '/deal-types', dealTypeController);
mountCrudRoutes(mastersRouter, '/payment-methods', paymentMethodController);
mountCrudRoutes(mastersRouter, '/expense-categories', expenseCategoryController);
mountCrudRoutes(mastersRouter, '/renewal-frequencies', renewalFrequencyController);
mountCrudRoutes(mastersRouter, '/countries', countryController);
mountCrudRoutes(mastersRouter, '/states', stateController);
mountSingletonRoutes(mastersRouter, '/invoice-configuration', invoiceConfigurationController);
mountSingletonRoutes(
  mastersRouter,
  '/notification-configuration',
  notificationConfigurationController,
);
mountSingletonRoutes(mastersRouter, '/branding', brandingController);

export {
  companyController,
  stageController,
  opportunitySourceController,
  industryController,
  dealTypeController,
  paymentMethodController,
  expenseCategoryController,
  renewalFrequencyController,
  countryController,
  stateController,
  invoiceConfigurationController,
  notificationConfigurationController,
  brandingController,
};
