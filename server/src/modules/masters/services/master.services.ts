import { googleSheetsService } from '../../../integrations';
import {
  BRANDING_CONTRACT,
  COMPANY_MASTER_CONTRACT,
  COUNTRY_CONTRACT,
  DEAL_TYPE_CONTRACT,
  EXPENSE_CATEGORY_CONTRACT,
  INDUSTRY_CONTRACT,
  INVOICE_CONFIGURATION_CONTRACT,
  NOTIFICATION_CONFIGURATION_CONTRACT,
  OPPORTUNITY_SOURCE_CONTRACT,
  PAYMENT_METHOD_CONTRACT,
  RENEWAL_FREQUENCY_CONTRACT,
  STAGE_MASTER_CONTRACT,
  STATE_CONTRACT,
} from '../contracts/master.contracts';
import {
  brandingMapper,
  companyMasterMapper,
  countryMapper,
  dealTypeMapper,
  expenseCategoryMapper,
  industryMapper,
  invoiceConfigurationMapper,
  notificationConfigurationMapper,
  opportunitySourceMapper,
  paymentMethodMapper,
  renewalFrequencyMapper,
  stageMasterMapper,
  stateMapper,
} from '../mappers/master.mappers';
import { createMasterRepository } from '../shared/master.repository';
import { MasterCrudService, MasterSingletonService } from '../shared/masterCrud.service';
import { SlugMasterCrudService } from '../shared/slugMasterCrud.service';
import type {
  BrandingEntity,
  CompanyMasterEntity,
  CountryEntity,
  DealTypeEntity,
  ExpenseCategoryEntity,
  IndustryEntity,
  InvoiceConfigurationEntity,
  NotificationConfigurationEntity,
  OpportunitySourceEntity,
  PaymentMethodEntity,
  RenewalFrequencyEntity,
  StageMasterEntity,
  StateEntity,
} from '../types/master.entities';

const sheets = googleSheetsService;

export const companyMasterRepository = createMasterRepository<CompanyMasterEntity>(
  'CompanyMasterRepository',
  sheets,
  COMPANY_MASTER_CONTRACT,
  companyMasterMapper,
);

export const stageMasterRepository = createMasterRepository<StageMasterEntity>(
  'StageMasterRepository',
  sheets,
  STAGE_MASTER_CONTRACT,
  stageMasterMapper,
);

export const opportunitySourceRepository = createMasterRepository<OpportunitySourceEntity>(
  'OpportunitySourceRepository',
  sheets,
  OPPORTUNITY_SOURCE_CONTRACT,
  opportunitySourceMapper,
);

export const industryRepository = createMasterRepository<IndustryEntity>(
  'IndustryRepository',
  sheets,
  INDUSTRY_CONTRACT,
  industryMapper,
);

export const dealTypeRepository = createMasterRepository<DealTypeEntity>(
  'DealTypeRepository',
  sheets,
  DEAL_TYPE_CONTRACT,
  dealTypeMapper,
);

export const paymentMethodRepository = createMasterRepository<PaymentMethodEntity>(
  'PaymentMethodRepository',
  sheets,
  PAYMENT_METHOD_CONTRACT,
  paymentMethodMapper,
);

export const expenseCategoryRepository = createMasterRepository<ExpenseCategoryEntity>(
  'ExpenseCategoryRepository',
  sheets,
  EXPENSE_CATEGORY_CONTRACT,
  expenseCategoryMapper,
);

export const renewalFrequencyRepository = createMasterRepository<RenewalFrequencyEntity>(
  'RenewalFrequencyRepository',
  sheets,
  RENEWAL_FREQUENCY_CONTRACT,
  renewalFrequencyMapper,
);

export const countryRepository = createMasterRepository<CountryEntity>(
  'CountryRepository',
  sheets,
  COUNTRY_CONTRACT,
  countryMapper,
);

export const stateRepository = createMasterRepository<StateEntity>(
  'StateRepository',
  sheets,
  STATE_CONTRACT,
  stateMapper,
);

export const invoiceConfigurationRepository = createMasterRepository<InvoiceConfigurationEntity>(
  'InvoiceConfigurationRepository',
  sheets,
  INVOICE_CONFIGURATION_CONTRACT,
  invoiceConfigurationMapper,
);

export const notificationConfigurationRepository =
  createMasterRepository<NotificationConfigurationEntity>(
    'NotificationConfigurationRepository',
    sheets,
    NOTIFICATION_CONFIGURATION_CONTRACT,
    notificationConfigurationMapper,
  );

export const brandingRepository = createMasterRepository<BrandingEntity>(
  'BrandingRepository',
  sheets,
  BRANDING_CONTRACT,
  brandingMapper,
);

export const companyMasterService = new MasterSingletonService(
  'CompanyMasterService',
  companyMasterRepository,
  'Company',
);

export const stageMasterService = new MasterCrudService(
  'StageMasterService',
  stageMasterRepository,
  'Stage',
);

export const opportunitySourceService = new MasterCrudService(
  'OpportunitySourceService',
  opportunitySourceRepository,
  'Opportunity Source',
);

export const industryService = new MasterCrudService(
  'IndustryService',
  industryRepository,
  'Industry',
);

export const dealTypeService = new SlugMasterCrudService(
  'DealTypeService',
  dealTypeRepository,
  'Deal Type',
);

export const paymentMethodService = new SlugMasterCrudService(
  'PaymentMethodService',
  paymentMethodRepository,
  'Payment Method',
);

export const expenseCategoryService = new MasterCrudService(
  'ExpenseCategoryService',
  expenseCategoryRepository,
  'Expense Category',
);

export const renewalFrequencyService = new MasterCrudService(
  'RenewalFrequencyService',
  renewalFrequencyRepository,
  'Renewal Frequency',
);

export const countryService = new MasterCrudService(
  'CountryService',
  countryRepository,
  'Country',
);

export const stateService = new MasterCrudService(
  'StateService',
  stateRepository,
  'State',
);

export const invoiceConfigurationService = new MasterSingletonService(
  'InvoiceConfigurationService',
  invoiceConfigurationRepository,
  'Invoice Configuration',
);

export const notificationConfigurationService = new MasterSingletonService(
  'NotificationConfigurationService',
  notificationConfigurationRepository,
  'Notification Configuration',
);

export const brandingService = new MasterSingletonService(
  'BrandingService',
  brandingRepository,
  'Branding',
);
