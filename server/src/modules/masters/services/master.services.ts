import { bootstrapService, googleSheetsService } from '../../../integrations';
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
const headers = bootstrapService.getHeaderManager();

export const companyMasterRepository = createMasterRepository<CompanyMasterEntity>(
  'CompanyMasterRepository',
  sheets,
  COMPANY_MASTER_CONTRACT,
  companyMasterMapper,
  headers,
);

export const stageMasterRepository = createMasterRepository<StageMasterEntity>(
  'StageMasterRepository',
  sheets,
  STAGE_MASTER_CONTRACT,
  stageMasterMapper,
  headers,
);

export const opportunitySourceRepository = createMasterRepository<OpportunitySourceEntity>(
  'OpportunitySourceRepository',
  sheets,
  OPPORTUNITY_SOURCE_CONTRACT,
  opportunitySourceMapper,
  headers,
);

export const industryRepository = createMasterRepository<IndustryEntity>(
  'IndustryRepository',
  sheets,
  INDUSTRY_CONTRACT,
  industryMapper,
  headers,
);

export const dealTypeRepository = createMasterRepository<DealTypeEntity>(
  'DealTypeRepository',
  sheets,
  DEAL_TYPE_CONTRACT,
  dealTypeMapper,
  headers,
);

export const paymentMethodRepository = createMasterRepository<PaymentMethodEntity>(
  'PaymentMethodRepository',
  sheets,
  PAYMENT_METHOD_CONTRACT,
  paymentMethodMapper,
  headers,
);

export const expenseCategoryRepository = createMasterRepository<ExpenseCategoryEntity>(
  'ExpenseCategoryRepository',
  sheets,
  EXPENSE_CATEGORY_CONTRACT,
  expenseCategoryMapper,
  headers,
);

export const renewalFrequencyRepository = createMasterRepository<RenewalFrequencyEntity>(
  'RenewalFrequencyRepository',
  sheets,
  RENEWAL_FREQUENCY_CONTRACT,
  renewalFrequencyMapper,
  headers,
);

export const countryRepository = createMasterRepository<CountryEntity>(
  'CountryRepository',
  sheets,
  COUNTRY_CONTRACT,
  countryMapper,
  headers,
);

export const stateRepository = createMasterRepository<StateEntity>(
  'StateRepository',
  sheets,
  STATE_CONTRACT,
  stateMapper,
  headers,
);

export const invoiceConfigurationRepository = createMasterRepository<InvoiceConfigurationEntity>(
  'InvoiceConfigurationRepository',
  sheets,
  INVOICE_CONFIGURATION_CONTRACT,
  invoiceConfigurationMapper,
  headers,
);

export const notificationConfigurationRepository =
  createMasterRepository<NotificationConfigurationEntity>(
    'NotificationConfigurationRepository',
    sheets,
    NOTIFICATION_CONFIGURATION_CONTRACT,
    notificationConfigurationMapper,
    headers,
  );

export const brandingRepository = createMasterRepository<BrandingEntity>(
  'BrandingRepository',
  sheets,
  BRANDING_CONTRACT,
  brandingMapper,
  headers,
);

export const companyMasterService = new MasterSingletonService(
  'CompanyMasterService',
  companyMasterRepository,
  'Company',
  { uniqueFields: ['companyName', 'email'] },
);

export const stageMasterService = new MasterCrudService(
  'StageMasterService',
  stageMasterRepository,
  'Stage',
  { uniqueFields: ['name'] },
);

export const opportunitySourceService = new MasterCrudService(
  'OpportunitySourceService',
  opportunitySourceRepository,
  'Opportunity Source',
  { uniqueFields: ['name'] },
);

export const industryService = new MasterCrudService(
  'IndustryService',
  industryRepository,
  'Industry',
  { uniqueFields: ['name'] },
);

export const dealTypeService = new SlugMasterCrudService(
  'DealTypeService',
  dealTypeRepository,
  'Deal Type',
  { uniqueFields: ['name', 'slug'] },
);

export const paymentMethodService = new SlugMasterCrudService(
  'PaymentMethodService',
  paymentMethodRepository,
  'Payment Method',
  { uniqueFields: ['name', 'slug'] },
);

export const expenseCategoryService = new MasterCrudService(
  'ExpenseCategoryService',
  expenseCategoryRepository,
  'Expense Category',
  { uniqueFields: ['name'] },
);

export const renewalFrequencyService = new MasterCrudService(
  'RenewalFrequencyService',
  renewalFrequencyRepository,
  'Renewal Frequency',
  { uniqueFields: ['name'] },
);

export const countryService = new MasterCrudService(
  'CountryService',
  countryRepository,
  'Country',
  { uniqueFields: ['name', 'code'] },
);

export const stateService = new MasterCrudService(
  'StateService',
  stateRepository,
  'State',
  {
    uniqueFields: ['name', 'code'],
    foreignKeys: [
      {
        field: 'countryId',
        label: 'Country',
        exists: async (id: string) => Boolean(await countryRepository.findById(id)),
      },
    ],
  },
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
